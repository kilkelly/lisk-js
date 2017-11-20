/*
 * Copyright © 2017 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
import {
	encryptMessageWithSecret,
	decryptMessageWithSecret,
	encryptPassphraseWithPassword,
	decryptPassphraseWithPassword,
} from '../../src/crypto/encrypt';

const convert = require('../../src/crypto/convert');
const keys = require('../../src/crypto/keys');
const hash = require('../../src/crypto/hash');

describe('encrypt', () => {
	const defaultSecret =
		'minute omit local rare sword knee banner pair rib museum shadow juice';
	const defaultPrivateKey =
		'314852d7afb0d4c283692fef8a2cb40e30c7a5df2ed79994178c10ac168d6d977ef45cd525e95b7a86244bbd4eb4550914ad06301013958f4dd64d32ef7bc588';
	const defaultPublicKey =
		'7ef45cd525e95b7a86244bbd4eb4550914ad06301013958f4dd64d32ef7bc588';
	const defaultSecondSecret = 'second secret';
	const defaultSecondPrivateKey =
		'9ef4146f8166d32dc8051d3d9f3a0c4933e24aa8ccb439b5d9ad00078a89e2fc0401c8ac9f29ded9e1e4d5b6b43051cb25b22f27c7b7b35092161e851946f82f';
	const defaultSecondPublicKey =
		'0401c8ac9f29ded9e1e4d5b6b43051cb25b22f27c7b7b35092161e851946f82f';
	const defaultMessage = 'Some default text.';
	const defaultPassword = 'myTotal53cr3t%&';

	let defaultEncryptedMessageWithNonce;

	let getPrivateAndPublicKeyBytesFromSecretStub;
	let hashStub;

	beforeEach(() => {
		defaultEncryptedMessageWithNonce = {
			encryptedMessage:
				'299390b9cbb92fe6a43daece2ceaecbacd01c7c03cfdba51d693b5c0e2b65c634115',
			nonce: 'df4c8b09e270d2cb3f7b3d53dfa8a6f3441ad3b14a13fb66',
		};
		sandbox
			.stub(convert, 'convertPrivateKeyEd2Curve')
			.returns(
				Buffer.from(
					'd8be8cacb03fb02f34e85030f902b635f364d6c23f090c7640e9dc9c568e7d5e',
					'hex',
				),
			);
		sandbox
			.stub(convert, 'convertPublicKeyEd2Curve')
			.returns(
				Buffer.from(
					'f245e78c83196d73452e55581ef924a1b792d352c142257aa3af13cded2e7905',
					'hex',
				),
			);

		getPrivateAndPublicKeyBytesFromSecretStub = sandbox.stub(
			keys,
			'getPrivateAndPublicKeyBytesFromSecret',
		);
		getPrivateAndPublicKeyBytesFromSecretStub.withArgs(defaultSecret).returns({
			privateKey: Buffer.from(defaultPrivateKey, 'hex'),
			publicKey: Buffer.from(defaultPublicKey, 'hex'),
		});
		getPrivateAndPublicKeyBytesFromSecretStub
			.withArgs(defaultSecondSecret)
			.returns({
				privateKey: Buffer.from(defaultSecondPrivateKey, 'hex'),
				publicKey: Buffer.from(defaultSecondPublicKey, 'hex'),
			});

		hashStub = sandbox
			.stub(hash, 'default')
			.returns(
				Buffer.from(
					'd43eed9049dd8f35106c720669a1148b2c6288d9ea517b936c33a1d84117a760',
					'hex',
				),
			);
	});

	describe('#encryptMessageWithSecret', () => {
		let encryptedMessage;

		beforeEach(() => {
			encryptedMessage = encryptMessageWithSecret(
				defaultMessage,
				defaultSecret,
				defaultPublicKey,
			);
		});

		it('should encrypt a message', () => {
			encryptedMessage.should.have
				.property('encryptedMessage')
				.be.hexString()
				.with.length(68);
		});

		it('should output the nonce', () => {
			encryptedMessage.should.have
				.property('nonce')
				.be.hexString()
				.with.length(48);
		});
	});

	describe('#decryptMessageWithSecret', () => {
		it('should be able to decrypt the message correctly using the receiver’s secret passphrase', () => {
			const decryptedMessage = decryptMessageWithSecret(
				defaultEncryptedMessageWithNonce.encryptedMessage,
				defaultEncryptedMessageWithNonce.nonce,
				defaultSecret,
				defaultPublicKey,
			);

			decryptedMessage.should.be.equal(defaultMessage);
		});
	});

	describe('encrypt and decrypt passphrase with password', () => {
		beforeEach(() => {
			hashStub.returns(
				Buffer.from(
					'e09dfc943d65d63f4f31e444c81afc6d5cf442c988fb87180165dd7119d3ae61',
					'hex',
				),
			);
		});

		describe('#encryptPassphraseWithPassword', () => {
			let cipher;

			beforeEach(() => {
				cipher = encryptPassphraseWithPassword(defaultSecret, defaultPassword);
			});

			it('should encrypt a passphrase', () => {
				cipher.should.be
					.type('object')
					.and.have.property('cipher')
					.and.be.hexString();
			});

			it('should output the IV', () => {
				cipher.should.be
					.type('object')
					.and.have.property('iv')
					.and.be.hexString()
					.and.have.length(32);
			});
		});

		describe('#decryptPassphraseWithPassword', () => {
			it('should decrypt a text with a password', () => {
				const cipherAndNonce = {
					cipher:
						'1c527b9408e77ae79e2ceb1ad5907ec523cd957d30c6a08dc922686e62ed98271910ca5b605f95aec98c438b6214fa7e83e3689f3fba89bfcaee937b35a3d931640afe79c353499a500f14c35bd3fd08',
					iv: '89d0fa0b955219a0e6239339fbb8239f',
				};
				const decrypted = decryptPassphraseWithPassword(
					cipherAndNonce,
					defaultPassword,
				);
				decrypted.should.be.eql(defaultSecret);
			});
		});

		describe('integration test', () => {
			it('should encrypt a given secret with a password and decrypt it back to the original passphrase', () => {
				const encryptedString = encryptPassphraseWithPassword(
					defaultSecret,
					defaultPassword,
				);
				const decryptedString = decryptPassphraseWithPassword(
					encryptedString,
					defaultPassword,
				);
				decryptedString.should.be.eql(defaultSecret);
			});
		});
	});
});
