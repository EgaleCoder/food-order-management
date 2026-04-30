import api from '../api/axiosInstance';
import { getSessionId } from '../utils/session';

const sid = () => getSessionId();

export const fetchCart = () =>
  api.get(`/cart/${sid()}`).then((r) => r.data.data);

export const apiAddItem = (item) =>
  api.post(`/cart/${sid()}/items`, {
    menuItemId: item._id,
    name:       item.name,
    price:      item.price,
    imageUrl:   item.imageUrl,
    quantity:   1,
  }).then((r) => r.data.data);

export const apiUpdateItem = (menuItemId, quantity) =>
  api.patch(`/cart/${sid()}/items/${menuItemId}`, { quantity }).then((r) => r.data.data);

export const apiRemoveItem = (menuItemId) =>
  api.delete(`/cart/${sid()}/items/${menuItemId}`).then((r) => r.data.data);

export const apiClearCart = () =>
  api.delete(`/cart/${sid()}`).then((r) => r.data.data);
