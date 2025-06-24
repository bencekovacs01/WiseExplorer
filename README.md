# WiseExplorer 🗺️

A sophisticated route optimization platform that implements and compares multiple algorithms for solving the Traveling Salesman Problem (TSP) with real-world Points of Interest (POI) data. Built with Next.js, TypeScript, and React, WiseExplorer provides an interactive web interface for analyzing route optimization algorithms with comprehensive performance metrics and visualizations.

## 🌟 Features

### Interactive Map Interface
- **Real-time Route Visualization**: Interactive map powered by Leaflet showing optimized routes
- **POI Management**: Dynamic loading and visualization of Points of Interest
- **Area Selection**: Click and drag to select geographical areas for route optimization
- **Multi-language Support**: Available in English, Hungarian, and Romanian

### Advanced Routing Algorithms

#### Exact Algorithms (Optimal Solutions)
- **Branch and Bound**: Optimal TSP solution using intelligent pruning
- **Dynamic Programming**: Held-Karp algorithm for exact TSP solutions
- **Backtracking**: Exhaustive search with optimization

#### Heuristic Algorithms (Scalable Solutions)
- **Bitonic TSP**: Fast approximation algorithm with 8 strategic variants:
  - West→East / East→West
  - South→North / North→South  
  - Clockwise / Counterclockwise
  - Inside-Out / Outside-In

### Comprehensive Performance Analysis
- **Execution Time Tracking**: Precise algorithm performance measurement
- **Route Quality Metrics**: Distance, duration, and efficiency analysis
- **Memory Usage Monitoring**: Resource consumption tracking
- **Comparative Visualizations**: Side-by-side algorithm comparisons

### Advanced Metrics System
- **Real-time Data Collection**: Automatic metrics recording during algorithm execution
- **Interactive Charts**: Bar charts for route duration, distance, and execution time
- **Group Comparisons**: Structured analysis across different problem sizes:
  - 15 nodes: Branch-and-Bound vs Dynamic Programming vs Bitonic
  - 30 nodes: Dynamic Programming vs Bitonic
  - 90 nodes: Bitonic strategy comparisons
- **CSV Export**: Export performance data for external analysis

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Modern component library
- **Leaflet** - Interactive mapping library
- **Recharts** - Data visualization components
- **Zustand** - State management

### Backend & APIs
- **Express.js** - API server
- **OpenRouteService** - Real routing and matrix calculations
- **Node.js** - Server runtime

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS** - Utility-first styling
- **Capacitor** - Mobile app development support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouteService API key (free at [openrouteservice.org](https://openrouteservice.org/dev/#/signup))
- SSL certificates for HTTPS development (see setup instructions below)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/WiseExplorer.git
   cd WiseExplorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   **Configure your environment variables in `.env.local`:**
   - Add your OpenRouteService API key:
     ```
     ORS_KEY=your_openrouteservice_api_key_here
     ```

4. **SSL Certificates Setup (Required for HTTPS)**
   
   Generate self-signed certificates for local HTTPS development:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes
   ```
   
   When prompted, you can use these example values:
   ```
   Country Name: US
   State: Your State
   City: Your City
   Organization: WiseExplorer Dev
   Organizational Unit: Development
   Common Name: localhost
   Email: your-email@example.com
   ```
   
   **Note**: Self-signed certificates will show browser security warnings, but are sufficient for local development and mobile device testing.

5. **Start development server**
5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### HTTPS Development
For development with HTTPS (useful for mobile testing and location services):
```bash
npm run https
```

**Prerequisites for HTTPS:**
- SSL certificates must be generated (see step 4 above)
- Navigate to `https://localhost:3000`
- Accept the browser security warning for self-signed certificates

**Why HTTPS is needed:**
- Required for geolocation services on mobile devices
- Needed for testing PWA features
- Enables secure API access from mobile browsers

## 📊 Algorithm Comparison

### Performance Characteristics

| Algorithm | Time Complexity | Space Complexity | Solution Quality | Scalability |
|-----------|----------------|------------------|------------------|-------------|
| Branch & Bound | O(n!) worst case | O(n) | Optimal | Small datasets (≤20 nodes) |
| Dynamic Programming | O(n²2ⁿ) | O(n2ⁿ) | Optimal | Medium datasets (≤30 nodes) |
| Backtracking | O(n!) | O(n) | Optimal | Small datasets (≤15 nodes) |
| Bitonic TSP | O(n log n) | O(n) | Approximation | Large datasets (90+ nodes) |

### Use Case Recommendations

- **Small Problems (5-15 POIs)**: Use Branch & Bound or Dynamic Programming for optimal routes
- **Medium Problems (15-30 POIs)**: Dynamic Programming balances optimality with reasonable execution time
- **Large Problems (30+ POIs)**: Bitonic algorithm provides excellent scalability with good quality routes

## 🎯 Usage Guide

### Basic Route Planning
1. **Select Area**: Click and drag on the map to define your area of interest
2. **Load POIs**: System automatically loads nearby Points of Interest
3. **Choose Algorithm**: Select from available routing algorithms
4. **View Results**: Analyze the optimized route and performance metrics

### Algorithm Comparison
1. **Run Multiple Algorithms**: Test different algorithms on the same POI set
2. **Compare Results**: Use the performance metrics panel to analyze trade-offs
3. **Export Data**: Download CSV files for further analysis

### Performance Testing
1. **Navigate to Metrics Page**: Access comprehensive algorithm testing
2. **Run Automated Tests**: Execute predefined test suites with real POI data
3. **Analyze Results**: Review detailed performance comparisons and visualizations

## 🔧 Project Structure

```
WiseExplorer/
├── app/                        # Next.js App Router
│   ├── [locale]/               # Internationalization
│   └── globals.css             # Global styles
├── src/
│   ├── components/             # React components
│   │   ├── Comparison/         # Algorithm comparison tools
│   │   ├── MapPage/            # Map interface
│   │   ├── Metrics/            # Performance metrics
│   │   └── Selector/           # POI selection tools
│   ├── services/               # Algorithm implementations
│   │   ├── BitonicService.ts   # Bitonic TSP algorithm
│   │   ├── BranchAndBoundService.ts
│   │   ├── DynamicProgrammingService.ts
│   │   ├── BacktrackingService.ts
│   │   └── MetricsService.ts   # Performance tracking
│   ├── models/                 # TypeScript interfaces
│   ├── utils/                  # Utility functions
│   └── constants/              # Application constants
├── public/                     # Static assets
└── docs/                       # Documentation files
```

## 📈 Performance Metrics

WiseExplorer automatically collects and analyzes:

- **Execution Time**: Algorithm processing duration
- **Route Quality**: Total distance and travel time
- **Resource Usage**: Memory consumption
- **Scalability**: Performance across different problem sizes

### Metric Categories
- **Route Duration**: Total travel time including POI visits
- **Route Distance**: Total geographical distance
- **Algorithm Efficiency**: Execution time vs. solution quality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouteService** for routing calculations and distance matrices
- **Leaflet** community for mapping capabilities  
- **Material-UI** team for the component library
- **Research Community** for TSP algorithm implementations and optimizations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bencekovacs01/WiseExplorer/issues)
- **Email**: kbence55@protonmail.com

## 🗺️ Roadmap

- [ ] Additional TSP algorithms (Ant Colony, Genetic Algorithm)
- [ ] Real-time traffic integration
- [ ] Mobile application (Capacitor-based)
- [ ] Advanced clustering algorithms
- [ ] Machine learning route optimization
- [ ] Multi-objective optimization (time, cost, carbon footprint)

---

**WiseExplorer** - Making route optimization accessible, visual, and scientifically rigorous. 🚀