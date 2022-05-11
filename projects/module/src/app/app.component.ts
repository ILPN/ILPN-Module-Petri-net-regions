import {Component} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {
    DropFile,
    FD_PETRI_NET,
    PetriNet,
    PetriNetParserService,
    PetriNetRegionsService,
    PetriNetRegionSynthesisService,
    PetriNetSerialisationService
} from 'ilpn-components';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [
        {provide: APP_BASE_HREF, useValue: '/ilovepetrinets/horse/'}
    ]
})
export class AppComponent {

    readonly FD_PN = FD_PETRI_NET;
    slideFc = new FormControl(false);
    showUploadText = true;
    result: DropFile | undefined;

    private _nets: Array<PetriNet> = [];

    constructor(private _parserService: PetriNetParserService,
                private _regionService: PetriNetRegionsService,
                private _regionSynthesisService: PetriNetRegionSynthesisService,
                private _netSerializer: PetriNetSerialisationService) {

    }

    processFileUpload(fileContent: Array<DropFile>) {
        const nets = fileContent.map(f => this._parserService.parse(f.content)).filter(pn => pn !== undefined);
        if (nets.length > 0) {
            this._nets = nets as Array<PetriNet>;
            this.computeRegions()
        }
    }

    private computeRegions() {
        this.showUploadText = false;
        this.result = undefined;

        this._regionSynthesisService.clear();

        this._regionService.computeRegions(this._nets[0], this.slideFc.value).subscribe({
            next: (r) => {
                this._regionSynthesisService.addRegion(r);
            },
            complete: () => {
                const result = this._regionSynthesisService.synthesise();
                this.result = new DropFile('result', this._netSerializer.serialise(result), 'pn');
            }
        });

    }
}
