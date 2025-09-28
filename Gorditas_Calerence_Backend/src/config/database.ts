import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mi_tienda_gorditas';
    
    await mongoose.connect(mongoUri);
    
    console.log(' MongoDB connected successfully');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(' MongoDB connection closed.');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }
};