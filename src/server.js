const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const systemPrompt = fs.readFileSync(path.join(__dirname, './prompts/aiprompt.txt'), 'utf-8');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI("AIzaSyDJuomJSn-tIBi2Y1myjn824ltJ4N-p_Ow");

const amadeus = new Amadeus({
  clientId: 'KGTmT8X6MEuPQ9f4TUCFPwZ4uPyrfLeH',
  clientSecret: 'G2bTCqAG1TpYGFKL'
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

app.post('/api/flights/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      travelClass = 'ECONOMY'
    } = req.body;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const travelClassMap = {
      'economy': 'ECONOMY',
      'premium-economy': 'PREMIUM_ECONOMY',
      'business': 'BUSINESS',
      'first': 'FIRST'
    };

    const searchParams = {
      originLocationCode: origin.slice(0, 3),
      destinationLocationCode: destination.slice(0, 3),
      departureDate,
      adults: parseInt(adults),
      travelClass: travelClassMap[travelClass] || 'ECONOMY',
      ...(returnDate && { returnDate })
    };

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
    const flights = response.data.slice(0, 10);
    const carriers = response.result.dictionaries.carriers;

    if (flights.length === 0) {
      return res.json({ flights: [] });
    }

    const formattedFlights = flights.map((offer) => {
      const itinerary = offer.itineraries[0];
      const segment = itinerary.segments[0];
      const carrierCode = segment.carrierCode;
      const airlineName = carriers[carrierCode] || carrierCode;

      return {
        id: offer.id,
        airline: airlineName,
        airlineLogoUrl: `https://pics.avs.io/200/200/${carrierCode}.png`,
        flightNumber: segment.number,
        origin: segment.departure.iataCode,
        destination: segment.arrival.iataCode,
        departureTime: segment.departure.at,
        arrivalTime: segment.arrival.at,
        duration: itinerary.duration,
        price: offer.price.total,
        status: 'On Time'
      };
    });

    res.json({ flights: formattedFlights });
  } catch (error) {
    console.error('Flight search error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to search flights',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/flights/status', async (req, res) => {
  try {
    const { carrierCode, flightNumber, scheduledDepartureDate } = req.body;

    if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
      return res.status(400).json({ error: 'Missing required fields: carrierCode, flightNumber, scheduledDepartureDate' });
    }

    const response = await amadeus.schedule.flights.get({
      carrierCode,
      flightNumber,
      scheduledDepartureDate
    });

    const flightData = response.data[0];
    if (!flightData) {
      return res.status(404).json({ error: 'No flight status found' });
    }

    const departure = flightData.flightPoints.find(p => p.departure);
    const arrival = flightData.flightPoints.find(p => p.arrival);

    if (!departure || !arrival) {
      return res.status(404).json({ error: 'Flight departure or arrival info not found' });
    }
    const originAirportResp = await amadeus.referenceData.locations.get({
      keyword: departure.iataCode,
      subType: 'AIRPORT'
    });
    const originAirportName = originAirportResp.data[0]?.name || 'Unknown Airport';

    const destinationAirportResp = await amadeus.referenceData.locations.get({
      keyword: arrival.iataCode,
      subType: 'AIRPORT'
    });
    const destinationAirportName = destinationAirportResp.data[0]?.name || 'Unknown Airport';
    const airlinesResp = await amadeus.referenceData.airlines.get({
      airlineCodes: carrierCode
    });
    const airlineInfo = airlinesResp.data[0];
    const airlineFullName = airlineInfo?.commonName || airlineInfo?.businessName || carrierCode;

    const departureTime = departure.departure.timings.find(t => t.qualifier === 'STD')?.value || 'Unknown';
    const arrivalTime = arrival.arrival.timings.find(t => t.qualifier === 'STA')?.value || 'Unknown';

    const status = {
      airlineCode: flightData.flightDesignator.carrierCode,
      airlineName: airlineFullName,
      airlineLogoUrl: `https://pics.avs.io/200/200/${carrierCode}.png`,
      flightNumber: flightData.flightDesignator.flightNumber,
      origin: departure.iataCode,
      originAirportName,
      departureTime,
      departureTerminal: 'Unknown',  
      departureGate: 'Unknown',     
      destination: arrival.iataCode,
      destinationAirportName,
      arrivalTime,
      arrivalTerminal: 'Unknown',
      arrivalGate: 'Unknown',
      status: flightData.status || 'Scheduled' 
    };

    res.json({ status });
  } catch (error) {
    console.error('Flight status error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch flight status',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/flights/ai-assistant', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
      generationConfig: {
        temperature: 0.3,
      },
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(query);
    const text = result.response.text();

    res.json({ response: text });

  } catch (error) {
    console.error("AI Assistant error:", error.message);
    res.status(500).json({
      error: "Failed to process query with AI assistant",
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
