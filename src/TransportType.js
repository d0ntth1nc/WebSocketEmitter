/*
 * Copyright (C) 2016 Alexander Seferinkyn
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
export default {
    /**
     * Message should have response
     */
    Request: 0,
    
    /**
     * Response of message
     */
    Response: 1,
    
    /**
     * Message should not have response
     */
    Notification: 2,
    
    /**
     * Subscribe for event
     */
    Subscribe: 3,
    
    /**
     * Unsubscribe for event
     */
    Unsubscribe: 4
};