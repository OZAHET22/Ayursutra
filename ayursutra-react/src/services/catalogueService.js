import API from './api';

/** Fetch all active catalogue items for the logged-in doctor */
export async function getCatalogueItems() {
    const res = await API.get('/catalogue');
    return res.data.data || [];
}

/**
 * Create or update (upsert) a catalogue item.
 * Backend upserts by doctorId+type+name, so calling this on an existing
 * item updates its price/gst without creating a duplicate.
 * @param {{ type, name, desc, price, gst }} item
 */
export async function saveCatalogueItem(item) {
    const res = await API.post('/catalogue', item);
    return res.data.data;
}

/** Update an existing catalogue item by id */
export async function updateCatalogueItem(id, data) {
    const res = await API.put(`/catalogue/${id}`, data);
    return res.data.data;
}

/** Soft-delete a catalogue item */
export async function deleteCatalogueItem(id) {
    const res = await API.delete(`/catalogue/${id}`);
    return res.data;
}
