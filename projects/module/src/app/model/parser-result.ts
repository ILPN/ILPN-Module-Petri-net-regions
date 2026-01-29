import {
    PetriNet
} from 'ilpn-components';

export interface ParserResult {
    net: PetriNet | undefined,
    fileName: string
}

export interface MultipleParserResults {
    nets: Array<PetriNet | undefined>,
    fileName: string
}
