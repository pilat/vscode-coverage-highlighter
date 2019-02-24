import { IStore, IFluxAction, IMiddleware, IFluxOptions } from '../../src/flux/types';
import { Flux } from '../../src/flux/flux';
import * as assert from 'assert';
import {mock, restore, Stub} from 'simple-mock';


class SimpleStore implements IStore {
    public initialState(): object {
        return {
            name: 'Initial name',
            list: [],
            some: {
                deep: {
                    object: {
                        name: 'Deep object'
                    }
                }
            }
        }
    }

    public onAction(type: string, data: any, state: any): object {
        if (type === 'TEST_ACTION') {
            return {
                ...state,
                name: data.newName
            }
        }
        return state;
    }
}


export class SimpleMiddleware implements IMiddleware {
    public preDispatch(_action: IFluxAction, _state: object){
        // noop
    }

    public postDispatch(_action: IFluxAction, _state: object){
        // noop
    }
}



describe('Flux is a global object', () => {
    it('should return the same object', () => {
        let flux = Flux.init({store: new SimpleStore()});
        assert.strictEqual(flux, Flux);
        Flux.reset();
    });

    it('should complain when init again', () => {
        const opts: IFluxOptions = {store: new SimpleStore()};

        Flux.init(opts);
        assert.throws(() => {
            Flux.init(opts);
        }, Error);
        Flux.reset();
    });
});


describe('Flux state', () => {
    let store: SimpleStore;
    let initialStateStub: Stub<SimpleStore>;

    beforeEach(() => {
        store = new SimpleStore();
        initialStateStub = mock(store, 'initialState');
        Flux.init({store});
    });

    afterEach(() => {
        Flux.reset();
        initialStateStub.reset();
    });

    it('should read default state once', () => {
        Flux.getState('name')
        Flux.getState('list')
        assert.strictEqual(initialStateStub.callCount, 1)
        restore();
    });

    it('should keep default state as mutable object', () => {
        assert.deepEqual(Flux.state, Flux.state);
    });

    it('should return the same object for getState() method and state prop', () => {
        assert.deepEqual(Flux.state, Flux.getState())
    });

    it('should do it event for deeply structures', () => {
        // @ts-ignore Object
        assert.deepEqual(Flux.state.some, Flux.getState('some'))
    });
    
    it('should work with simple pathes', () => {
        assert.strictEqual(Flux.getState('name'), 'Initial name')
    });

    it('should work with deep pathes', () => {
        assert.strictEqual(Flux.getState('some.deep.object.name'), 'Deep object')
    });

    it('also should support default values', () => {
        assert.strictEqual(Flux.getState('some.unexisting.object', 'DEFAULT'), 'DEFAULT')
    });
});


describe('Flux dispatch', () => {
    let store: SimpleStore;
    let onActionStub: Stub<SimpleStore>;

    beforeEach(() => {
        store = new SimpleStore();
        onActionStub = mock(store, 'onAction');
        Flux.init({store});
    });

    afterEach(() => {
        Flux.reset();
        onActionStub.reset();
    });

    it('should process onAction on state', () => {
        Flux.dispatch({type: 'SOME'});
        assert.deepEqual(onActionStub.callCount, 1);
    });

    it('should update current state', () => {
        Flux.dispatch({type: 'TEST_ACTION', newName: 'New name'});
        assert.deepEqual(Flux.getState('name'), 'New name')
    });

    it('should keeps mutable objects', () => {
        const prevDeep = Flux.getState('some.deep');
        Flux.dispatch({type: 'TEST_ACTION', newName: 'New name'});
        assert.deepEqual(Flux.getState('some.deep'), prevDeep)
    });

    it('should call action on subscribers', () => {
        const listener = mock().returnWith('wow');
        Flux.on('TEST_ACTION', listener.bind(this));
        Flux.dispatch({type: 'TEST_ACTION', newName: 'New name'});
        assert.deepEqual(listener.callCount, 1);
        listener.reset();
    });

    it('should support second way to subscribe', () => {
        const listener = mock().returnWith('wow');
        Flux.on('TEST_ACTION', listener, this);
        Flux.dispatch({type: 'TEST_ACTION', newName: 'New name'});
        assert.deepEqual(listener.callCount, 1);
        listener.reset();
    });

    it('should do it even if action do nothing', () => {
        const listener = mock().returnWith('wow');
        Flux.on('NOT_HANDLED_ACTION', listener, this);
        Flux.dispatch({type: 'NOT_HANDLED_ACTION', some: 'Value'});
        assert.deepEqual(listener.callCount, 1);
        listener.reset();
    });

    it('should pass original action to all subscribers', () => {
        const listener1 = mock().returnWith('wow');
        const listener2 = mock().returnWith('wow');
        Flux.on('NOT_HANDLED_ACTION', listener1, this);
        Flux.on('NOT_HANDLED_ACTION', listener2, this);
        const dispatchAction: IFluxAction = {type: 'NOT_HANDLED_ACTION', some: 'Value'};
        Flux.dispatch(dispatchAction);
        assert.deepEqual(listener1.calls[0].arg , dispatchAction);
        assert.deepEqual(listener2.calls[0].arg , dispatchAction);
        listener1.reset();
        listener2.reset();
    });

    it('should do state modification even when a subscriber falls down', () => {
        const expectedError = new Error('Oops');
        const listener = mock().throwWith(expectedError)
        Flux.on('TEST_ACTION', listener, this);
        assert.throws(() => {
            Flux.dispatch({type: 'TEST_ACTION', newName: 'Okay'});
        }, expectedError)
        assert.deepEqual(onActionStub.callCount, 1);
        assert.deepEqual(Flux.getState('name'), 'Okay');
        listener.reset();
    });

    it('should consider whose unsubscribe from dispatch events', () => {
        const listener1 = mock().returnWith('wow');
        const listener2 = mock().returnWith('wow');
        const bindableListener1 = listener1.bind(this)
        const bindableListener2 = listener2.bind(this)
        Flux.on('ANY_ACTION', bindableListener1);
        Flux.on('ANY_ACTION', bindableListener2);
        Flux.off('ANY_ACTION', bindableListener1);

        Flux.dispatch({type: 'ANY_ACTION'});
        assert.ok(!listener1.called);
        assert.ok(listener2.called);
        listener1.reset();
        listener2.reset();
    });

    it('should support dispose() way to unsubscribe', () => {
        const disposablesList: any[] = []
        const listener = mock().returnWith('wow');
        
        Flux.on('ANY_ACTION', listener, this, disposablesList);
        disposablesList[0].dispose();

        Flux.dispatch({type: 'ANY_ACTION'});
        assert.ok(!listener.called);
        listener.reset();
    });
});


describe('Flux middleware', () => {
    let middleware: SimpleMiddleware;
    let onPreDispatch: Stub<SimpleMiddleware>;
    let onPostDispatch: Stub<SimpleMiddleware>;

    beforeEach(() => {
        middleware = new SimpleMiddleware();
        onPreDispatch = mock(middleware, 'preDispatch');
        onPostDispatch = mock(middleware, 'postDispatch');
        Flux.init({store: new SimpleStore(), middlewares: [middleware]});
    });

    afterEach(() => {
        Flux.reset();
        onPreDispatch.reset();
        onPostDispatch.reset();
    });

    it('should receive preDespatch and postDispatch events', () => {
        Flux.dispatch({type: 'ANY_EVENT', any: 'data'});
        assert.deepEqual(onPreDispatch.callCount, 1);
        assert.deepEqual(onPostDispatch.callCount, 1);
    });

    it('should receive state before and after changes', () => {
        const oldName = Flux.getState('name')
        const newName = 'New name'
        const dispatchAction: IFluxAction = {type: 'TEST_ACTION', newName};
        
        Flux.dispatch(dispatchAction);
        assert.deepEqual(onPreDispatch.calls[0].args[1].name, oldName)
        assert.deepEqual(onPostDispatch.calls[0].args[1].name, newName)
    });
});
