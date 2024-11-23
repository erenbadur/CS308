import { v4 as uuidv4 } from 'uuid';

// Generate a sessionId if not already set
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('sessionId', sessionId);
}

