/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import {Directive, ElementRef, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs/Subscription";
import {DatagridRenderOrganizer} from "./render-organizer";
import {DomAdapter} from "./dom-adapter";

@Directive({
    selector: "[clrDgBody]"
})
export class DatagridBodyRenderer implements OnDestroy {

    constructor(private el: ElementRef, private organizer: DatagridRenderOrganizer, private domAdapter: DomAdapter) {
        this.subscription = organizer.scrollbar.subscribe(() => this.computeScrollbarWidth());
    }

    private subscription: Subscription;
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private computeScrollbarWidth() {
        this.organizer.scrollbarWidth.next(this.domAdapter.getScrollBarWidth(this.el.nativeElement));
    }
}