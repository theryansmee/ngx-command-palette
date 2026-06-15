import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import {
	BrowserDynamicTestingModule,
	platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { beforeEach } from 'vitest';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

beforeEach(() => {
	TestBed.resetTestingModule();
});
