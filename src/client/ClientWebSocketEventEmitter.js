/*
 * Copyright (C) 2016 Alexander Seferinkyn
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
import { w3cwebsocket as W3CWebSocket } from "websocket";
import WebSocketEventEmitter from "../WebSocketEventEmitter";
import TransportType from "../TransportType";

export default class ClientWebSocketEventEmitter extends WebSocketEventEmitter {
    constructor() {
        super();
        this._client = null;
    }
    
    on( event, ...args ) {
        if ( event !== "error" && event !== "connected" && event !== "disconnected" && this.listeners( event ).length === 0 ) {
            this._sendEvent( {
                transportType: TransportType.Subscribe,
                event: event,
                payload: undefined,
                error: undefined,
                id: -1
            } );
        }
        return super.on( event, ...args );
    }
    
    off( event, ...args ) {
        if ( event !== "error" && event !== "connected" && event !== "disconnected" && this.listeners( event ).length === 1 ) {
            this._sendEvent( {
                transportType: TransportType.Unsubscribe,
                event: event,
                payload: undefined,
                error: undefined,
                id: -1
            } );
        }
        return super.off( event, ...args );
    }
    
    connect( endpoint, protocol ) {
        this._client = new W3CWebSocket( endpoint, protocol );
        this._client.onerror = event => this.emit( "error", event );
        this._client.onopen = event => this.emit( "connected", event );
        this._client.onclose = event => this.emit( "disconnected", event );
        this._client.onmessage = event => this._readEvent( JSON.parse( event.data ) );
    }
    
    disconnect() {
        this._client.close();
        this._client = null;
    }
    
    isConnected() {
        return !!this._client && this._client.readyState === this._client.OPEN;
    }
    
    _sendEvent( event ) {
        let id = super._sendEvent( event );
        this._client.send( JSON.stringify( event ) );
        return id;
    }
}
