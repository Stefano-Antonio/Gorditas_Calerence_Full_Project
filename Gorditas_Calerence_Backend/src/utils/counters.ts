import mongoose from 'mongoose';

interface ICounter {
  _id: string;
  sequence_value: number;
}

const counterSchema = new mongoose.Schema<ICounter>({
  _id: String,
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model<ICounter>('Counter', counterSchema);

export const getNextSequence = async (name: string): Promise<number> => {
  const result = await Counter.findByIdAndUpdate(
    name,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return result.sequence_value;
};

export const generateFolio = async (): Promise<string> => {
  const sequence = await getNextSequence('orden');
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  return `ORD-${year}${month}${day}-${sequence.toString().padStart(4, '0')}`;
};

// Obtener el siguiente número de pedido del día
export const getNextPedidoNumber = async (): Promise<number> => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  // ID único por día: pedido-YYYYMMDD
  const counterId = `pedido-${year}${month}${day}`;
  
  const result = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  
  return result.sequence_value;
};