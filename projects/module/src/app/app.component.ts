import {Component} from '@angular/core';
import {
    DropFile,
    FD_PETRI_NET,
    PetriNet,
    PetriNetParserService,
    PetriNetRegionSynthesisService,
    PetriNetSerialisationService
} from 'ilpn-components';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    readonly FD_PN = FD_PETRI_NET;
    fcOneBoundRegions = new FormControl(false);
    fcEmptyOutput = new FormControl(false);
    fcPartialOrders = new FormControl(false);
    showUploadText = true;
    result: DropFile | undefined;

    private _nets: Array<PetriNet> = [];

    constructor(private _parserService: PetriNetParserService,
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

        this._regionSynthesisService.synthesise(this._nets, {
            oneBoundRegions: this.fcOneBoundRegions.value,
            noOutputPlaces: this.fcEmptyOutput.value,
            obtainPartialOrders: this.fcPartialOrders.value
        }).subscribe(result => {
            this.result = new DropFile('result', this._netSerializer.serialise(result.result), 'pn');
        });

    }
}
