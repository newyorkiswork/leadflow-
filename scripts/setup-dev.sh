#!/bin/bash

# LeadFlow AI - Development Environment Setup Script
# This script sets up the complete development environment for LeadFlow AI

set -e

echo "🏠 Setting up LeadFlow AI Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL 14+ from https://postgresql.org/"
        print_warning "You can also use Docker: docker run --name leadflow-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14"
    fi
    
    # Check Redis (optional)
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis is not installed. Some features may not work optimally."
        print_warning "You can install Redis or use Docker: docker run --name leadflow-redis -p 6379:6379 -d redis:7"
    fi
    
    print_success "Prerequisites check completed"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
        print_warning "Please edit .env file with your actual configuration values"
        print_warning "Required: DATABASE_URL, OPENAI_API_KEY, PROPSTREAM_API_KEY, BATCHSKIPTRACE_API_KEY"
    else
        print_warning ".env file already exists. Skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Install backend dependencies
    if [ -d "server" ]; then
        print_status "Installing backend dependencies..."
        cd server && npm install && cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if DATABASE_URL is set
    if [ -f .env ]; then
        source .env
        if [ -z "$DATABASE_URL" ]; then
            print_warning "DATABASE_URL not set in .env file"
            print_warning "Please set DATABASE_URL and run: npm run db:migrate"
            return
        fi
    else
        print_warning ".env file not found. Please create it first."
        return
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npm run db:generate
    
    # Run database migrations
    print_status "Running database migrations..."
    npm run db:push
    
    # Seed database (optional)
    if [ -f "prisma/seed.ts" ]; then
        print_status "Seeding database with sample data..."
        npm run db:seed
    fi
    
    print_success "Database setup completed"
}

# Setup Docker (optional)
setup_docker() {
    print_status "Setting up Docker environment..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        # Create docker-compose.yml if it doesn't exist
        if [ ! -f docker-compose.yml ]; then
            cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: leadflow_ai
      POSTGRES_USER: leadflow
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF
            print_success "Created docker-compose.yml for local services"
        fi
        
        print_status "Starting Docker services..."
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        print_success "Docker services started"
    else
        print_warning "Docker not found. Skipping Docker setup."
    fi
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if we can connect to database
    if command -v npm &> /dev/null; then
        if npm run db:generate &> /dev/null; then
            print_success "Database connection verified"
        else
            print_warning "Database connection failed. Please check your DATABASE_URL"
        fi
    fi
    
    # Check if frontend builds
    if [ -d "frontend" ]; then
        print_status "Checking frontend build..."
        cd frontend
        if npm run build &> /dev/null; then
            print_success "Frontend build successful"
        else
            print_warning "Frontend build failed. Check for errors."
        fi
        cd ..
    fi
    
    # Check if backend builds
    if [ -d "server" ]; then
        print_status "Checking backend build..."
        cd server
        if npm run build &> /dev/null; then
            print_success "Backend build successful"
        else
            print_warning "Backend build failed. Check for errors."
        fi
        cd ..
    fi
}

# Main setup function
main() {
    echo "🏠 LeadFlow AI - Real Estate Investor Platform"
    echo "=============================================="
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_environment
    echo ""
    
    install_dependencies
    echo ""
    
    # Ask if user wants to use Docker
    read -p "Do you want to set up local services with Docker? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_docker
        echo ""
    fi
    
    setup_database
    echo ""
    
    verify_setup
    echo ""
    
    print_success "🎉 LeadFlow AI development environment setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your API keys and configuration"
    echo "2. Start the development servers:"
    echo "   npm run dev"
    echo ""
    echo "3. Open your browser to:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo ""
    echo "4. Access Prisma Studio (database GUI):"
    echo "   npm run db:studio"
    echo ""
    echo "For more information, see README.md"
    echo ""
    print_success "Happy coding! 🚀"
}

# Run main function
main "$@"
