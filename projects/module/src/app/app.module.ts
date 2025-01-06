import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {
    IlpnAlgorithmsModule,
    IlpnComponentsModule,
    PetriNetLayoutManagerFactoryService,
    PnDisplayModule,
    SpringEmbedderLayoutManagerFactoryService
} from 'ilpn-components';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_BASE_HREF, PlatformLocation} from '@angular/common';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        IlpnComponentsModule,
        PnDisplayModule,
        IlpnAlgorithmsModule.withDebugConfig({
            logRegions: true
        }),
        FlexLayoutModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
    ],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        },
        {
            provide: PetriNetLayoutManagerFactoryService,
            useExisting: SpringEmbedderLayoutManagerFactoryService,
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
