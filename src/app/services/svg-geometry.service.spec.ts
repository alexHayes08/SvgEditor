import { TestBed, inject } from '@angular/core/testing';

import { SvgGeometryService } from './svg-geometry.service';

describe('SvgGeometryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SvgGeometryService]
    });
  });

  it('should be created', inject([SvgGeometryService], (service: SvgGeometryService) => {
    expect(service).toBeTruthy();
  }));
});
