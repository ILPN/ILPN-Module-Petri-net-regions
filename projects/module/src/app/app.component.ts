import {Component} from '@angular/core';
import {
    DropFile,
    FD_PETRI_NET,
    IncrementingCounter,
    PetriNet,
    PetriNetParserService,
    PetriNetRegionSynthesisService,
    PetriNetSerialisationService,
    SynthesisResult
} from 'ilpn-components';
import {FormControl} from '@angular/forms';
import {BehaviorSubject, filter, map, merge, Observable, Subject} from "rxjs";
import {InputTab} from "./model/input-tab";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    readonly FD_PN = FD_PETRI_NET;
    // TODO arc weights / self-loops
    fcOneBoundRegions = new FormControl(false);
    fcEmptyOutput = new FormControl(false);
    fcPartialOrders = new FormControl(false);
    showUploadText = true;
    initialUpload = true;
    loading$ = new BehaviorSubject<boolean>(false);
    result: DropFile | undefined;
    result$: BehaviorSubject<PetriNet | undefined>;
    inputs$: BehaviorSubject<Array<PetriNet>>;
    resultNet$: Observable<PetriNet>;
    inputNet$: Observable<PetriNet>;
    showNet$: Subject<PetriNet>;
    private _tabIdCounter: IncrementingCounter = new IncrementingCounter();
    inputTabs: Array<InputTab> = [];

    private _nets: Array<PetriNet> = [];

    constructor(private _parserService: PetriNetParserService,
                private _regionSynthesisService: PetriNetRegionSynthesisService,
                private _netSerializer: PetriNetSerialisationService) {
        this.result$ = new BehaviorSubject<PetriNet | undefined>(undefined);
        this.inputs$ = new BehaviorSubject<Array<PetriNet>>([]);
        this.showNet$ = new Subject();
        this.resultNet$ = this.result$.pipe(filter(v => v !== undefined)) as Observable<PetriNet>;
        this.inputNet$ = merge(
            this.inputs$.pipe(filter(v => v.length > 0), map(v => v[0])),
            this.showNet$.asObservable()
        );
    }

    processFileUpload(fileContent: Array<DropFile>) {
        const parsedNets = fileContent.map(f => ({net: this._parserService.parse(f.content), fileName: f.name})).filter(pr => pr.net !== undefined);
        if (parsedNets.length > 0) {
            this._nets = parsedNets.map(pn => pn.net) as Array<PetriNet>;
            this.inputTabs = parsedNets.map(pn => ({id: this._tabIdCounter.next(), label: pn.fileName}));
            this.inputs$.next(this._nets);
            this.computeRegions()
        }
    }

    private computeRegions() {
        this.showUploadText = false;
        this.result = undefined;
        this.loading$.next(true);

        this._regionSynthesisService.synthesise(this._nets, {
            noArcWeights: this.fcOneBoundRegions.value,
            noOutputPlaces: this.fcEmptyOutput.value,
            obtainPartialOrders: this.fcPartialOrders.value
        }).subscribe((result: SynthesisResult) => {
            this.result = new DropFile('result', this._netSerializer.serialise(result.result), 'pn');
            this.initialUpload = false;
            this.result$.next(result.result);
            this.loading$.next(false)
        });

    }

    selectedTabIndexChanged(newIndex: number) {
        this.showNet$.next(this._nets[newIndex]);
    }

    trackTabById(index: number, tab: InputTab): number {
        return tab.id;
    }
}
