import { useState } from 'react';
import { placeOrder } from '../services/orderService';
import logger from '../utils/logger';

const useOrder = () => {
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const submitOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    logger.info('[useOrder] Submitting order', { customerName: orderData.customerName });
    try {
      const result = await placeOrder(orderData);
      setOrder(result);
      logger.info('[useOrder] Order submitted successfully', { orderId: result._id });
      return result;
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      logger.error('[useOrder] Order submission failed', { error: msg });
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { order, loading, error, submitOrder };
};

export default useOrder;
