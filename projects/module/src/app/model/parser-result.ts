import {
    PetriNet
} from 'ilpn-components';

export interface ParserResult {
    net: PetriNet | undefined,
    fileName: string
}
