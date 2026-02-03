# Luxe Travel Plans Backend

Backend API built using **Express.js** for the BodyRock application.

## Features

* RESTful API endpoints for BodyRock functionality.
* Well-documented API for easy testing and integration.

## Getting Started

### Prerequisites

* Node.js (v14+ recommended)
* npm or yarn
* MongoDB (if required for your database)

### Installation

```bash
git clone https://github.com/mutahirdevxtech/ltp-backend.git
cd ltp-backend
npm install
npm start
```

### Environment Variables

Create a `.env` file and add necessary variables (example):

```
MONGO_URI = 
MONGO_DATABASE = 
JWT_KEY = 
CLOUDINARY_CLOUD_NAME = 
CLOUDINARY_API_KEY = 
CLOUDINARY_API_SECRET = 
POSTMARK_SERVER_TOKEN = 
```

## API Documentation

You can explore and test the API endpoints using **Postman**:
[Postman Documentation](https://documenter.getpostman.com/view/42538377/2sBXc7LQUf)

## Usage

* Start the server:

```bash
npm run dev
```

* Access the API via `http://localhost:5002`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
