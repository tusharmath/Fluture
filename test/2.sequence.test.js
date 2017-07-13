import {Future, of, never, after} from '../index.es.js';
import {expect} from 'chai';
import {add, bang, noop, error, assertResolved, assertRejected} from './util';
import {resolved, rejected, resolvedSlow} from './futures';
import {Sequence, Core} from '../src/core';
import {StateT} from 'fantasy-states';

describe('Sequence', () => {

  const dummy = new Sequence(resolved);

  describe('ap', () => {

    const seq = of(bang).ap(dummy);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of(s => `${s}!`).ap(Future.of("resolved"))');
      });

    });

  });

  describe('map', () => {

    const seq = dummy.map(bang);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").map(s => `${s}!`)');
      });

    });

  });

  describe('bimap', () => {

    const seq = dummy.bimap(add(1), bang);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").bimap(b => a + b, s => `${s}!`)');
      });

    });

  });

  describe('chain', () => {

    const seq = dummy.chain(x => of(bang(x)));

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").chain(x => of(bang(x)))');
      });

    });

  });

  describe('mapRej', () => {

    const seq = dummy.mapRej(add(1));

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").mapRej(b => a + b)');
      });

    });

  });

  describe('chainRej', () => {

    const seq = dummy.chainRej(_ => of(1));

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").chainRej(_ => of(1))');
      });

    });

  });

  describe('race', () => {

    const seq = dummy.race(dummy);

    it('returns itself when racing Never', () => {
      expect(dummy.race(never)).to.equal(dummy);
    });

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").race(Future.of("resolved"))');
      });

    });

  });

  describe('both', () => {

    const seq = dummy.both(dummy);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, ['resolved', 'resolved']);
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").both(Future.of("resolved"))');
      });

    });

  });

  describe('and', () => {

    const seq = dummy.and(dummy);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").and(Future.of("resolved"))');
      });

    });

  });

  describe('or', () => {

    const seq = dummy.or(dummy);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").or(Future.of("resolved"))');
      });

    });

  });

  describe('swap', () => {

    const seq = dummy.swap();
    const nseq = new Sequence(rejected).swap();

    describe('#fork()', () => {

      it('swaps from right to left', () => {
        return assertRejected(seq, 'resolved');
      });

      it('swaps from left to right', () => {
        return assertResolved(nseq, 'rejected');
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").swap()');
      });

    });

  });

  describe('fold', () => {

    const seq = dummy.fold(_ => 0, _ => 1);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 1);
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").fold(_ => 0, _ => 1)');
      });

    });

  });

  describe('finally', () => {

    const seq = dummy.finally(dummy);

    describe('#fork()', () => {

      it('runs the action', () => {
        return assertResolved(seq, 'resolved');
      });

      it('runs the other if the left rejects', done => {
        const other = Future(() => {done()});
        const m = new Sequence(rejected).finally(other);
        m.fork(noop, noop);
      });

    });

    describe('#toString()', () => {

      it('returns code to create the same data-structure', () => {
        expect(seq.toString()).to.equal('Future.of("resolved").finally(Future.of("resolved"))');
      });

    });

  });

  describe('in general', () => {

    describe('#fork()', () => {

      it('is capable of joining', () => {
        const m = new Sequence(of('a'))
        //eslint-disable-next-line max-nested-callbacks
        .chain(x => after(5, `${x}b`).chain(x => after(5, `${x}c`)))
        .chain(x => after(5, `${x}d`))
        .chain(x => of(`${x}e`))
        .chain(x => after(5, `${x}f`));
        return assertResolved(m, 'abcdef');
      });

      it('is capable of early termination', done => {
        const slow = new Sequence(Future(() => {
          const id = setTimeout(done, 20, new Error('Not terminated'));
          return () => clearTimeout(id);
        }));
        const m = slow.race(slow).race(slow).race(slow).race(resolved);
        m.fork(noop, noop);
        setTimeout(done, 40, null);
      });

      it('cancels running actions when one early-terminates asynchronously', done => {
        const slow = new Sequence(Future(() => {
          const id = setTimeout(done, 50, new Error('Not terminated'));
          return () => clearTimeout(id);
        }));
        const m = slow.race(slow).race(slow).race(slow).race(resolvedSlow);
        m.fork(noop, noop);
        setTimeout(done, 100, null);
      });

      it('does not run actions unnecessarily when one early-terminates synchronously', done => {
        const broken = new Sequence(Future(_ => { console.log('broken'); done(error) }));
        const m = resolvedSlow.race(broken).race(broken).race(resolved);
        m.fork(noop, _ => done());
      });

      it('resolves the left-hand side first when running actions in parallel', () => {
        const m = new Sequence(of(1)).map(x => x).chain(x => of(x));
        return assertResolved(m.race(of(2)), 1);
      });

      it('does not forget about actions to run after early termination', () => {
        const m = new Sequence(after(30, 'a'))
                  .race(new Sequence(after(20, 'b')))
                  .map(x => `${x}c`);
        return assertResolved(m, 'bc');
      });

      it('does not run early terminating actions twice, or cancel them', done => {
        const mock = Object.create(Core);
        mock._fork = (l, r) => r(done()) || (() => done(error));
        const m = new Sequence(after(30, 'a')).map(x => `${x}b`).race(mock);
        m.fork(noop, noop);
      });

      it('does not run run concurrent computations twice', done => {
        let ran = false;
        const mock = Future(_ => { ran ? done(error) : (ran = true) });
        const m = new Sequence(resolvedSlow).chain(_ => resolvedSlow).race(mock);
        m.fork(done, _ => done());
      });

      it('returns a cancel function which cancels all running actions', done => {
        let i = 0;
        const started = _ => void i++;
        const cancelled = _ => --i < 1 && done();
        const slow = Future(() => started() || (() => cancelled()));
        const m = slow.race(slow).race(slow).race(slow).race(slow);
        const cancel = m.fork(noop, noop);
        expect(i).to.equal(5);
        cancel();
      });

    });

  });

  describe('Bug 2017-06-02, reported by @d3vilroot', () => {

    const Middleware = StateT(Future);
    const slow = Middleware.lift(after(10, null));
    const program = slow.chain(_ => slow.chain(_ => slow)).evalState(null);

    it('does not occur', done => {
      program.fork(done, _ => done());
    });

  });

});
