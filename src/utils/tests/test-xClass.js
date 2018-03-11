import {expect} from 'chai';
import xClass from '../xClass';

describe('xClass', function(){
	
	var testObj = {
		'a': () => true,
		'b': () => false,
		'c': () => true,
		'd': false,
		'e': true
	};

	it('reduces objects with {class: predicate} pairs into a string of classes', function(){
		expect(
			xClass(testObj)
		).to.equal('a c e');
	})

	it('can reduce any number of arguments', function(){
		expect(
			xClass(
				testObj,
				'a',
				'b'
			)
		).to.equal('a c e b');
	})

	it('can reduce no arguments into an empty string', function(){
		expect(
			xClass(() => false)
		).to.equal('');
	})

	it('can reduce array arguments', function(){
		expect(
			xClass(
				testObj,
				'a',
				'b',
				['ace', 'yxz']
			)
		).to.equal('a c e b ace yxz');
	})

	it('ignores integer, boolean, and falsey arguments', function(){
		expect(
			xClass(
				testObj,
				'a',
				'b',
				1,
				5,
				false,
				undefined,
				['ace', 'yxz']
			)
		).to.equal('a c e b ace yxz');
	})

	it('does not include duplicate classes', function(){
		expect(
			xClass(
				'a', 'a', 'a',
				() => 'b',
				'b',
				{a: true, c: true}
			)
		).to.equal('a b c');
	})

	it('can take a function that returns an object', function (){
		expect(
			xClass(() => testObj)
		).to.equal('a c e');
	})

})