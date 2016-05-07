/*
 * Copyright (C) 2016 Alexander Seferinkyn
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */
import { server as WebSocketServer } from "websocket";
import WebSocketEventEmitter from "../WebSocketEventEmitter";
import ClientWebSocketEventEmitter from "./ClientWebSocketEventEmitter";
import TransportType from "../TransportType";

export default class ServerWebSocketEventEmitter extends WebSocketEventEmitter {
    constructor( protocol ) {
        super();
        if ( !protocol ) {
            throw new TypeError( "No protocol specified" );
        }
        this._server = null;
        this._clients = new Set();
        this._protocol = protocol;
    }
    
    connect( httpServer ) {
        this._server = new WebSocketServer( {
            httpServer: httpServer,
            autoAcceptConnections: false
        } );
        this._server.on( "request", this._acceptClient.bind( this ) );
    }
    
    isConnected() {
        return !!this._server;
    }
    
    _sendEvent( event ) {
        this.emit( event.event, event.payload );
    }
    
    _acceptClient( request ) {
        if ( !this._isOriginAllowed( request.origin ) ) {
            request.reject();
        }
        else if ( this.listeners( "connection" ).length > 0 ) {
            let connection = request.accept( this._protocol, request.origin );
            let client = new ClientWebSocketEventEmitter( connection );
            this._clients.add( client );
            this._bindClientListeners( client );
            this.emit( "connection", client );
        }
        else {
            request.reject();
        }
    }
    
    _isOriginAllowed( origin ) {
        return true;
    }
    
    _bindClientListeners( client ) {
        let clientHandlers = new Map();
        client.on( "subscribe", event => {
            clientHandlers.set( event, payload => client.remoteEmit( event, payload ) );
            this.on( event, clientHandlers.get( event ) );
        } );
        client.on( "unsubscribe", event => {
            this.off( event, clientHandlers.get( event ) );
        } );
        client.on( "disconnected", () => {
            this._clients.delete( client );
            client.removeAllListeners();
            clientHandlers.clear();
        } );
    }
}
