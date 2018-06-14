import { TestBed, inject } from '@angular/core/testing';

import { UniqueIDService } from './unique-id.service';

describe('UniqueIDService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniqueIDService]
    });
  });

  it('should be created', inject([UniqueIDService], (service: UniqueIDService) => {
    expect(service).toBeTruthy();
  }));
});
