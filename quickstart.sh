#!/bin/bash

# ParkPulse Quick Start Script
# This script helps you set up the complete ParkPulse development environment

set -e  # Exit on error

echo "🚀 ParkPulse Quick Start"
echo "======================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Step 1: Environment Setup
echo -e "${YELLOW}📝 Step 1: Environment Setup${NC}"
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration before proceeding${NC}"
    echo "   Run: nano .env"
    echo ""
    read -p "Press Enter after editing .env file..."
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Step 2: Start Docker Services
echo -e "${YELLOW}🐳 Step 2: Starting Docker Services${NC}"
echo "This may take a few minutes on first run..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
docker-compose ps
echo ""

# Step 3: Initialize Database
echo -e "${YELLOW}🗄️  Step 3: Database Initialization${NC}"
read -p "Do you want to initialize the database now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating database tables..."
    docker-compose exec -T backend python -c "from core.database import Base, engine; Base.metadata.create_all(bind=engine)" || true
    echo -e "${GREEN}✅ Database initialized${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped database initialization${NC}"
fi
echo ""

# Step 4: Generate Synthetic Data
echo -e "${YELLOW}🎲 Step 4: Generate Training Data${NC}"
read -p "Do you want to generate synthetic parking data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Generating 90 days of data for 10 parking lots..."
    mkdir -p data
    cd simulator
    python3 generate_data.py --lots 10 --days 90 --output ../data || true
    cd ..
    echo -e "${GREEN}✅ Data generated in ./data/ directory${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped data generation${NC}"
fi
echo ""

# Step 5: Train ML Models
echo -e "${YELLOW}🧠 Step 5: Train ML Models${NC}"
if [ -f "data/occupancy_synthetic.csv" ]; then
    read -p "Do you want to train forecasting models? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Training Prophet models..."
        mkdir -p models
        cd ml-pipeline
        python3 train_prophet.py --data ../data/occupancy_synthetic.csv --output ../models || true
        cd ..
        echo -e "${GREEN}✅ Models trained in ./models/ directory${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipped model training${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No training data found. Please generate data first.${NC}"
fi
echo ""

# Step 6: Display Access Information
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📍 Access Your Services:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Backend API:        http://localhost:8000"
echo "  📚 API Documentation:  http://localhost:8000/docs"
echo "  📊 Grafana:            http://localhost:3001 (admin/admin)"
echo "  📈 Prometheus:         http://localhost:9090"
echo "  🗄️  PGAdmin:            http://localhost:5050"
echo "     Email: admin@parkpulse.io  Password: admin"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  View logs:             docker-compose logs -f backend"
echo "  Stop services:         docker-compose down"
echo "  Restart services:      docker-compose restart"
echo "  Check service status:  docker-compose ps"
echo "  Access database:       psql -h localhost -U parkpulse -d parkpulse"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📖 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. Read PROJECT_SUMMARY.md for complete overview"
echo "  2. Check docs/FRONTEND_INTEGRATION.md for frontend setup"
echo "  3. Test API endpoints: http://localhost:8000/docs"
echo "  4. Integrate your React frontend with API"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"
echo ""
