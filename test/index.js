var assert = require( "chai" ).assert;
var createServer = require( "http" ).createServer;
var Server = require( "../lib/server" ).ServerWebSocketEventEmitter;
var Client = require( "../lib/client" ).ClientWebSocketEventEmitter;

var server = new Server( "asd" );
var connection = null;
var httpServer = createServer().listen(9654);
var client = new Client();

describe("Communication", function() {
    describe("server#connect", function () {
        it( "should throw error if no http server", function () {
            assert.throws( function() { server.connect() }, Error, "You must specify an httpServer on which to mount the WebSocket server." );
        });
        it( "should not throw error if http server is valid", function() {
            assert.doesNotThrow( function() { server.connect( httpServer ) } );
        });
    });
    describe("server#on", function() {
        it( "should bind event listener successfully", function() {
            assert.doesNotThrow( function() { 
                server.on( "connection", function( conn ) {
                    connection = conn;
                } );
            } );
        });
    });
    describe("client#connect", function() {
        it( "should not be connected after connection", function() {
            assert.strictEqual( client.isConnected(), false );
        });
        it( "should not throw error if ws server is valid", function( done ) {
            assert.doesNotThrow( function() { client.connect( "ws://localhost:9654", "asd" ) } );
            client.on( "connected", function() {
                done();
            } );
        });
        it( "should be connected after connection", function() {
            assert.strictEqual( client.isConnected(), true );
        });
    });
    describe("server state", function() {
        it( "should have connection", function() {
            assert.isNotNull( connection );
        } );
    });
    describe("server -> client communication", function() {
        var clientResult = null;
        var expectedClientResult = { a: 5 };
        it( "client should subscribe without errors", function() {
            assert.doesNotThrow( function() {
                client.on( "event", function(payload) {
                    clientResult = payload;
                } )
            } );
        });
        it( "client should have response", function( done ) {
            connection.remoteEmit( "event", expectedClientResult );
            assert.isNull( clientResult );
            setTimeout( done, 100 );
        });
        it( "client response should be the same", function() {
            assert.deepEqual( expectedClientResult, clientResult );
        });
    });
    describe("client -> server communication", function() {
        var serverResult = null;
        var expectedServerResult = { a: 5 };
        it( "server should subscribe without errors", function() {
            assert.doesNotThrow( function() {
                connection.on( "event", function(payload) {
                    serverResult = payload;
                } )
            } );
        });
        it( "server should have response", function( done ) {
            client.remoteEmit( "event", expectedServerResult );
            assert.isNull( serverResult );
            setTimeout( done, 100 );
        });
        it( "server response should be the same", function() {
            assert.deepEqual( expectedServerResult, serverResult );
        });
    });
    describe("client rpc", function() {
        var serverResult = null;
        var expectedServerResult = { a: 5 };
        var clientResult = null;
        var clientExpectedResult = [ 1, 3, 2, "asdsad", ["asdsad", {a: 5, b: {q: 1}}] ];
        var wildcardExpectedResult = ["asdsad", {a: 5, b: {q: 1}}];
        var wildcardResult = null;
        it( "server should subscribe without errors", function() {
            assert.doesNotThrow( function() {
                connection.on( "event2", function( payload ) {
                    serverResult = payload;
                    return 1;
                } );
                connection.on( "event2", function( payload ) {
                    serverResult = payload;
                    return 3;
                } );
                connection.on( "event2", function( payload ) {
                    serverResult = payload;
                    return 2;
                } );
                connection.on( "event2", function( payload ) {
                    serverResult = payload;
                    return "asdsad";
                } );
                connection.on( "event2", function( payload ) {
                    serverResult = payload;
                    return ["asdsad", {a: 5, b: {q: 1}}];
                } );
                connection.on( "event::wildcard", function( payload ) {
                    return ["asdsad", {a: 5, b: {q: 1}}];
                } );
            } );
        });
        it( "client should emit request event without error", function( done ) {
            assert.doesNotThrow( function() {
                client.remoteEmitAsync( "event2", expectedServerResult ).then(function(result) {
                    clientResult = result;
                    client.remoteEmitAsync( "event::wildcard", wildcardExpectedResult ).then(function(result) {
                        wildcardResult = result[0];
                        done();
                    });
                });
            } );
        });
        it( "server response should be the same", function() {
            assert.deepEqual( expectedServerResult, serverResult );
        });
        it( "client response should be the same", function() {
            assert.deepEqual( clientResult, clientExpectedResult );
        });
        it( "client wildcard response should be the same", function() {
            assert.deepEqual( wildcardResult, wildcardExpectedResult );
        });
    });
});
var client2 = new Client();
describe("Broadcasting", function() {
    describe("emit", function() {
        it( "should not throw error if another client is connected", function( done ) {
            assert.doesNotThrow( function() { client2.connect( "ws://localhost:9654", "asd" ) } );
            setTimeout( done, 100 );
        });
        var client1result = null;
        var client2result = null;
        it( "should subscribe without errors", function() {
            assert.doesNotThrow( function() {
                client.on( "globalEvent", function( eventData ) {
                    client1result = eventData;
                } );
                client2.on( "globalEvent", function( eventData ) {
                    client2result = eventData;
                } );
            } );
        });
        it( "should broadcast without errors", function() {
            assert.doesNotThrow( function() {
                server.remoteEmit( "globalEvent", { a: 5 } );
            } );
        });
        it( "client response should be the same", function( done ) {
            assert.deepEqual( client1result, { a: 5 } );
            setTimeout( done, 100 );
        });
        it( "client2 response should be the same", function( done ) {
            assert.deepEqual( client2result, { a: 5 } );
            setTimeout( done, 100 );
        });
    });
});