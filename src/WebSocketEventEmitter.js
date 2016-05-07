/*
 * Copyright (C) 2016 Alexander Seferinkyn
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
import EventEmitter2 from "eventemitter2";
import TransportType from "./TransportType";

const PENDING_REQUESTS_LIMIT = 100;
const REQUEST_TIMEOUT = 2000;
const emitterConfig = {
    wildcard: true,
    delimiter: '::',
    newListener: false,
    maxListeners: 20
};

export default class WebSocketEventEmitter extends EventEmitter2 {
    constructor() {
        super( emitterConfig );
        this._pendingRequests = new Map(); // Keep track of the messages awaiting for response
        this._messageIdCounter = 1; // Track progress of ids
    }
    
    remoteEmit( event, payload ) {
        if ( !this.isConnected() ) {
            throw new Error( "Not connected" );
        }
        
        this._sendEvent( {
            transportType: TransportType.Notification,
            event: event,
            payload: payload,
            error: undefined,
            id: -1
        } );
    }
    
    remoteEmitAsync( event, payload ) {
        if ( this._pendingRequests.size >= PENDING_REQUESTS_LIMIT ) {
            return Promise.reject( new Error( `More than ${PENDING_REQUESTS_LIMIT} requests for less than ${REQUEST_TIMEOUT / 1000} seconds... what the hell!!!` ) );
        }
        
        if ( !this.isConnected() ) {
            return Promise.reject( new Error( "Not connected. Call connect to fix this problem." ) );
        }
        
        let eventId = this._sendEvent( {
            transportType: TransportType.Request,
            event: event,
            payload: payload,
            error: undefined,
            id: undefined
        } );
        
        return this._awaitResponse( eventId );
    }
    
    isConnected() {
        return false;
    }
    
    _sendEvent( event ) {
        
        if ( !event.id ) {
            if ( this._messageIdCounter === Number.MAX_VALUE ) {
                this._messageIdCounter = 1;
            }
            
            event.id = this._messageIdCounter++;
        }
        
        return event.id;
    }
    
    _awaitResponse( eventId ) {
        return new Promise( (resolve, reject) => {
            this._pendingRequests.set( eventId, { resolve, reject } );
            
            // Important step which prevents memory leak
            setTimeout( () => {
                if ( this._pendingRequests.has( eventId ) ) {
                    this._pendingRequests.get( eventId ).reject( new Error( "Request timeout" ) );
                    this._pendingRequests.delete( eventId );
                }
            }, REQUEST_TIMEOUT );
        } );
    }
    
    _readEvent( { transportType, event, payload, error, id } ) {
        
        if ( transportType === TransportType.Notification ) {
            this.emit( event, payload );
            return true;
        }
        else if ( transportType === TransportType.Response ) {
            if ( this._pendingRequests.has( id ) ) {
                let promise = this._pendingRequests.get( id );

                if ( error ) promise.reject( error );
                else promise.resolve( payload );

                this._pendingRequests.delete( id );
            }
            else {
            }
            return true;
        }
        else if ( transportType === TransportType.Request ) {
            let eventMessage = {
                transportType: TransportType.Response,
                event: event,
                payload: undefined,
                error: undefined,
                id: id
            };
            this.emitAsync( event, payload )
                .then( result => {
                    eventMessage.payload = result;
                    this._sendEvent( eventMessage );
                } )
                .catch( error => {
                    eventMessage.error = result;
                    this._sendEvent( eventMessage );
                } );
            return true;
        }
        else {
            return false;
        }
    }
}
