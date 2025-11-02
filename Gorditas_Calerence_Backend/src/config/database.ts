import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mi_tienda_gorditas';

    console.log('🔄 Connecting to MongoDB...');

    // Configuración de opciones de conexión
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Aumentar timeout a 30 segundos
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    // Event listeners para monitorear la conexión
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed.');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('❌ MongoDB connection error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    // Mensajes de ayuda específicos según el tipo de error
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Posibles soluciones:');
      console.error('1. Verifica que tu IP esté en la lista blanca de MongoDB Atlas');
      console.error('2. Verifica las credenciales en el archivo .env');
      console.error('3. Verifica tu conexión a internet');
      console.error('4. Verifica que el firewall no esté bloqueando la conexión');
    }

    throw error; // Lanzar el error para que sea manejado por startServer
  }
};