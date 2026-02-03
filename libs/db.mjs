import "dotenv/config"
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI
const dbName = process.env.MONGO_DATABASE

async function run() {
    try {
        await mongoose.connect(uri, { dbName });
    } catch (err) {
        console.log("mongodb connection error", err);
        process.exit(1);
    }
}

run().catch(console.dir);

mongoose.connection.on('connected', () => {
    console.log("mongoose is connected");
});

mongoose.connection.on('disconnected', () => {
    console.log("mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', (err) => {
    console.log('mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', async () => {
    console.log("app is terminating");
    await mongoose.connection.close();
    console.log('Mongoose default connection closed');
    process.exit(0);
});