import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  const fetchInventario = async () => {
    try {
      const response = await apiService.getInventario();
      if (response.success && Array.isArray(response.data)) {
        setProductos(response.data);
      } else {
        setError('No se pudieron cargar los datos del inventario.');
      }
    } catch (err) {
      setError('Error al cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  fetchInventario();
}, []);

  if (loading) {
    return <div>Cargando inventario...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
  <div style={{ padding: '20px' }}>
    <h1>Inventario</h1>
    {productos.length === 0 ? (
  <p>No hay productos en el inventario.</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto, index) => (
            <tr key={index}>
              <td>{producto.nombre}</td>
              <td>{producto.cantidad}</td>
              <td>${producto.precio.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
};

export default Inventario;