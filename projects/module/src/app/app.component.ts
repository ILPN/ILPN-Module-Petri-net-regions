import {Component} from '@angular/core';
import {
    DanglingPlaceRemoverService,
    DropFile,
    FD_PETRI_NET,
    IncrementingCounter,
    ImplicitPlaceRemoverService,
    PetriNet,
    PetriNetParserService,
    PetriNetRegionSynthesisService,
    PetriNetSerialisationService,
    PnOutputFileFormat,
    PostPlaceAdderService,
    SynthesisResult
} from 'ilpn-components';
import {FormControl} from '@angular/forms';
import {BehaviorSubject, filter, map, merge, Observable, Subject} from "rxjs";
import {InputTab} from "./model/input-tab";
import {ParserResult} from "./model/parser-result";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    readonly FD_PN = FD_PETRI_NET;
    // TODO arc weights / self-loops
    fcOneBoundRegions = new FormControl<boolean>(false);
    fcPartialOrders = new FormControl<boolean>(false);
    fcMode = new FormControl<string>('synthesis');
    showUploadText = true;
    noNets = true;
    loading$ = new BehaviorSubject<boolean>(false);
    result: DropFile | undefined;
    result$: BehaviorSubject<PetriNet | undefined>;
    inputs$: BehaviorSubject<Array<PetriNet>>;
    resultNet$: Observable<PetriNet>;
    inputNet$: Observable<PetriNet>;
    showNet$: Subject<PetriNet>;
    private _tabIdCounter: IncrementingCounter = new IncrementingCounter();

    inputTabs: Array<InputTab> = [];
    private _selectedTabIndex: number | undefined;

    private _nets: Array<PetriNet> = [];

    constructor(private _parserService: PetriNetParserService,
                private _regionSynthesisService: PetriNetRegionSynthesisService,
                private _netSerializer: PetriNetSerialisationService,
                private _postProcessing: DanglingPlaceRemoverService,
                private _implicitPlaceRemover: ImplicitPlaceRemoverService,
                private _postPlaceAdder: PostPlaceAdderService) {
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
        const parsedNets: Array<ParserResult> = fileContent
            .map(f => ({net: this._parserService.parse(f.content), fileName: f.name}))
            .filter(pr => pr.net !== undefined)
            .map(pr => {
                PetriNet.implyInitialMarking(pr.net!);
                return pr;
            });
        if (parsedNets.length > 0) {
            this._nets = [...this._nets, ...parsedNets.map(pn => pn.net) as unknown as Array<PetriNet>];
            this.inputTabs = [...this.inputTabs, ...parsedNets.map(pn => ({id: this._tabIdCounter.next(), label: pn.fileName}))];
            this.inputs$.next(this._nets);
            if (this._selectedTabIndex === undefined) {
                this._selectedTabIndex = 0;
            }
            this.computeRegions()
        }
    }

    private computeRegions() {
        this.showUploadText = false;
        this.result = undefined;
        this.loading$.next(true);

        const timeStart = performance.now();

        this._regionSynthesisService.synthesise(this._nets, {
            noArcWeights: this.fcOneBoundRegions.value,
            noOutputPlaces: this.isDiscoveryMode(),
            obtainPartialOrders: this.fcPartialOrders.value
        }).subscribe((result: SynthesisResult) => {
            const timeEnd = performance.now();

            let net = this._implicitPlaceRemover.removeImplicitPlaces(this._postProcessing.removeDanglingPlaces(result.result));
            if (this.isDiscoveryMode()) {
                net = this._postPlaceAdder.addPostPlaces(net);
            }
            const timeEndPost = performance.now();

            const ser = this._netSerializer.serialise(net, PnOutputFileFormat.JSON);
            console.debug(ser);
            console.debug('elapsed time in synthesis (without post processing) [ms]', timeEnd-timeStart);
            console.debug('elapsed time post processing [ms]', timeEndPost-timeEnd);
            this.result = new DropFile('result', ser, 'json');
            this.noNets = false;
            this.result$.next(net);
            this.loading$.next(false)
        });

    }

    selectedTabIndexChanged(newIndex: number) {
        this.showNet$.next(this._nets[newIndex]);
        this._selectedTabIndex = newIndex;
    }

    prevent(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
    }

    tabDeleteButtonClick(e: MouseEvent, index: number) {
        this.prevent(e);
        if (this._selectedTabIndex === undefined) {
            console.error("illegal state: delete button pressed and selected index is undefined");
            return;
        }
        if (index < this._selectedTabIndex) {
            this._selectedTabIndex--;
        } else if (index === this._selectedTabIndex) {
            if (index !== this._nets.length - 1) {
                this.selectedTabIndexChanged(index + 1);
            } else if (index !== 0) {
                this.selectedTabIndexChanged(index - 1);
            }
        }
        this._nets.splice(index, 1);
        this.inputTabs.splice(index, 1)
        this.inputTabs = [...this.inputTabs] // TODO replace by .toSpliced() when we update JS version
        if (this._nets.length === 0) {
            this.noNets = true;
            this._selectedTabIndex = undefined;
        } else {
            this.computeRegions();
        }
    }

    trackTabById(index: number, tab: InputTab): number {
        return tab.id;
    }

    private isDiscoveryMode(): boolean {
        return this.fcMode.value === 'discovery';
    }
}
