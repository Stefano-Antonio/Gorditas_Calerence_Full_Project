export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const calculateImporte = (costo: number, cantidad: number): number => {
  return Math.round((costo * cantidad) * 100) / 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const createResponse = (success: boolean, data?: any, message?: string) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};