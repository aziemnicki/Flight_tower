# Flight Tower

A modern web application that provides real-time flight tracking information using FlightRadar24API. The application consists of a Next.js frontend and a Python FastAPI backend, offering a responsive and interactive user experience for tracking flights.

## 🌟 Features

- **Real-time Flight Tracking**: View live flight information including aircraft details, routes, and status
- **Interactive Map**: Visualize flight paths and current positions on an interactive map
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Multi-language Support**: Built-in internationalization support
- **API-First Architecture**: Clean separation between frontend and backend

## 🏗️ Project Structure

```
Flight_tower/
├── backend/               # Python FastAPI backend
│   ├── app/              # Application code
│   ├── src/              # Source files
│   └── requirements.txt  # Python dependencies
│
└── flight-tower/         # Next.js frontend
    ├── app/              # App router pages
    ├── components/       # Reusable React components
    ├── features/         # Feature-based modules
    └── public/           # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Python 3.10+
- FlightRadar24 API library

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   # or using uv
   uv pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd flight-tower
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🌍 Deployment

The application can be deployed to Vercel (frontend) and any Python hosting service that supports FastAPI (backend).

### Vercel Deployment

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables if needed
4. Deploy!

## 🔧 Environment Variables

Create a `.env.local` file in the `flight-tower` directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
# Add other environment variables as needed
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FlightRadar24 for their flight data API
- Next.js and FastAPI teams for their amazing frameworks
