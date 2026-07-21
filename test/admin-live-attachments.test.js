'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseLiveAttachment,
  createLiveAttachmentElement,
} = require('../js/admin-live-messages');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = {};
    this.textContent = '';
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

const fakeDocument = {
  createElement(tagName) {
    return new FakeElement(tagName);
  },
  createTextNode(text) {
    return { nodeType: 3, textContent: String(text) };
  },
};

test('attachment parser accepts only HTTP(S) URLs', () => {
  assert.equal(parseLiveAttachment('[이미지]\njavascript:alert(1)'), null);
  assert.equal(parseLiveAttachment('[이미지]\ndata:text/html,<script>alert(1)</script>'), null);
  assert.equal(parseLiveAttachment('[파일: attack.html]\njavascript:alert(1)'), null);

  const image = parseLiveAttachment('[이미지]\nhttps://example.com/photo.jpg');
  assert.deepEqual(image, {
    kind: 'image',
    url: 'https://example.com/photo.jpg',
  });

  const file = parseLiveAttachment('[파일: sample.pdf]\nhttp://example.com/sample.pdf');
  assert.deepEqual(file, {
    kind: 'file',
    fileName: 'sample.pdf',
    mediaType: 'file',
    url: 'http://example.com/sample.pdf',
  });
});

test('image attachment keeps attacker-controlled quotes out of executable attributes', () => {
  const attackUrl = 'https://example.com/x\" onerror=\"globalThis.pwned=1\' onclick=\'globalThis.pwned=2';
  const attachment = parseLiveAttachment(`[이미지]\n${attackUrl}`);
  assert.ok(attachment);

  const opened = [];
  const downloaded = [];
  const failed = new Set();
  const fakeWindow = {
    _failedImgUrls: failed,
    _downloadImg(url) { downloaded.push(url); },
    open(...args) { opened.push(args); },
  };
  const root = createLiveAttachmentElement(attachment, fakeDocument, fakeWindow);
  const [image, button] = root.children;

  assert.equal(image.src, attachment.url);
  assert.equal(image.attributes.has('onclick'), false);
  assert.equal(image.attributes.has('onerror'), false);
  assert.equal(Object.hasOwn(image, 'onclick'), false);
  assert.equal(Object.hasOwn(image, 'onerror'), false);
  assert.deepEqual([...image.listeners.keys()].sort(), ['click', 'error']);
  assert.deepEqual([...button.listeners.keys()], ['click']);

  image.listeners.get('click')();
  button.listeners.get('click')();
  image.listeners.get('error')();
  assert.deepEqual(opened, [[attachment.url, '_blank', 'noopener,noreferrer']]);
  assert.deepEqual(downloaded, [attachment.url]);
  assert.equal(failed.has(attachment.url), true);
  assert.equal(image.style.display, 'none');
});

test('file name and URL are assigned through DOM properties, not HTML', () => {
  const attachment = parseLiveAttachment(
    '[파일: <img src=x onerror=globalThis.pwned=1>.pdf]\nhttps://example.com/file\'\".pdf'
  );
  assert.ok(attachment);
  const root = createLiveAttachmentElement(attachment, fakeDocument, {});
  const link = root.children[1];

  assert.equal(link.textContent, attachment.fileName);
  assert.equal(link.href, attachment.url);
  assert.equal(link.attributes.has('onclick'), false);
  assert.equal(link.attributes.has('onerror'), false);
});

test('video, audio, and failed-image rendering behavior is preserved', () => {
  const video = parseLiveAttachment('[파일: clip.mp4]\nhttps://example.com/clip.mp4');
  const audio = parseLiveAttachment('[파일: voice.mp3]\nhttps://example.com/voice.mp3');
  const videoNode = createLiveAttachmentElement(video, fakeDocument, {}).children[0];
  const audioNode = createLiveAttachmentElement(audio, fakeDocument, {}).children[0];
  assert.equal(videoNode.tagName, 'VIDEO');
  assert.equal(videoNode.controls, true);
  assert.equal(videoNode.preload, 'metadata');
  assert.equal(audioNode.tagName, 'AUDIO');
  assert.equal(audioNode.controls, true);

  const image = parseLiveAttachment('[이미지]\nhttps://example.com/missing.jpg');
  const failedImageNode = createLiveAttachmentElement(image, fakeDocument, {
    _failedImgUrls: new Set([image.url]),
  });
  assert.equal(failedImageNode.textContent, '[이미지 없음]');
  assert.equal(failedImageNode.children.length, 0);
});
