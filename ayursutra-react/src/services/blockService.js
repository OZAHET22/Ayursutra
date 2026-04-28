import API from './api';

/** Fetch all unavailability blocks for the logged-in doctor */
export async function getAllBlocks() {
    const res = await API.get('/blocks/all');
    return res.data;
}

/** Alias for backward compatibility */
export async function getMyBlocks() {
    return getAllBlocks();
}

/**
 * Get blocks for a specific date (used by slot picker / schedule view).
 * @param {string} doctorId
 * @param {string} date - YYYY-MM-DD
 */
export async function getBlocksForDate(doctorId, date) {
    const res = await API.get(`/blocks?doctorId=${doctorId}&date=${date}`);
    return res.data.data || [];
}

/**
 * Create a new block.
 * @param {object} block - { date?, isRecurring, dayOfWeek?, startHour, startMinute, endHour, endMinute, reason }
 */
export async function createBlock(block) {
    const res = await API.post('/blocks', block);
    return res.data.data;
}

/**
 * Update an existing block.
 * @param {string} id - Block ID
 * @param {object} block - { date?, isRecurring, dayOfWeek?, startHour, startMinute, endHour, endMinute, reason }
 */
export async function updateBlock(id, block) {
    const res = await API.patch(`/blocks/${id}`, block);
    return res.data.data;
}

/** Remove a block by id */
export async function deleteBlock(id) {
    const res = await API.delete(`/blocks/${id}`);
    return res.data;
}
