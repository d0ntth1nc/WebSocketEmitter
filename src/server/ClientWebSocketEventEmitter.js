/*
 * Copyright (C) 2016 Alexander Seferinkyn
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
import WebSocketEventEmitter from "../WebSocketEventEmitter";
import TransportType from "../TransportType";

export default class ClientWebSocketEventEmitter extends WebSocketEventEmitter {
    constructor( connection ) {
        super();
        this._connection = connection;
        this._isConnected = true;
        
        connection.on( "message", event => this._readEvent( JSON.parse( event.utf8Data ) ) );
        connection.on( "close", event => {
            this.emit( "disconnected" );
            this._isConnected = false;
        } );
        connection.on( "error", event => this.emit( "error", error ) );
    }
    
    isConnected() {
        return this._isConnected;
    }
    
    _sendEvent( event ) {
        let id = super._sendEvent( event );
        this._connection.sendUTF( JSON.stringify( event ) );
        return id;
    }
    
    _readEvent( data ) {
        if ( !super._readEvent( data ) ) {
            switch ( data.transportType ) {
                case TransportType.Subscribe:
                    this.emit( "subscribe", data.event );
                    break;
                case TransportType.Unsubscribe:
                    this.emit( "unsubscribe", data.event );
                    break;
            }
        }
    }
}
