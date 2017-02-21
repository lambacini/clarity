/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {Injectable, Renderer} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {DomAdapter} from "../utils/dom-adapter";

const COMPUTE_WIDTH_CLASS = "datagrid-computing-columns-width";
const STRICT_WIDTH_CLASS = "datagrid-fixed-width";

@Injectable()
export class ColumnsWidth {

    constructor(private renderer: Renderer) {}

    private domAdapter = new DomAdapter();

    /**
     * Native elements for column headers
     */
    private _headers: any[];
    public get headers() {
        return this._headers;
    }
    public set headers(newHeaders: any[]) {
        if (!newHeaders) { return; }
        /*
         * Put this back when we decide to handle column reordering without re-computing sizes.
         */
        // let newWidths: {px: number, strict: boolean}[] = [];
        // if (this._headers) {
        //     newHeaders.forEach((header, index) => {
        //         let previousIndex = this._headers.indexOf(header);
        //         if (previousIndex >= 0) {
        //             newWidths[index] = this.widths[previousIndex];
        //         }
        //     });
        // }
        this.clearHeadersWidth();
        this._headers = newHeaders;
        this.widths = [];
    }

    /**
     * Computed width for each column. Strict means that the column is not flexible,
     * it has a hard-coded width that should always be respected.
     */
    private widths: {px: number, strict: boolean}[] = [];

    /**
     * Computes the width of all columns, preserving user-specified widths on the headers.
     * Takes a native element wrapping both headers and rows, to briefly use table display as the
     * fastest and browser-optimized way to compute reasonable columns width.
     */
    public setColumnsWidth(tableWrapper: any) {
        this.clearHeadersWidth();
        let newWidths: {px: number, strict: boolean}[] = [];
        // We first set strict widths on columns that have a user-defined width on the header.
        // The user-defined width can be from anywhere: CSS, styles attribute, styles binding with Angular, ...
        this.headers.forEach((header, index) => {
            let strictWidth = this.domAdapter.getUserDefinedWidth(header);
            if (strictWidth) {
                newWidths[index] = {px: strictWidth, strict: true};
            }
        });
        // We very briefly use table layout to let the browser do the heavy work.
        // We then use the width the browser recommends as flex-basis for our columns.
        this.renderer.setElementClass(tableWrapper, COMPUTE_WIDTH_CLASS, true);
        this.headers.forEach((header, index) => {
            if (!newWidths[index]) {
                newWidths[index] = {px: this.domAdapter.scrollWidth(header), strict: false};
            }
        });
        this.renderer.setElementClass(tableWrapper, COMPUTE_WIDTH_CLASS, false);
        this.widths = newWidths;
        this.headers.forEach(this.setHeaderWidth.bind(this));
        this._resize.next();
    }

    /**
     * The Observable that lets other classes subscribe to column size changes
     */
    private _resize = new Subject<number>();
    // We do not want to expose the Subject itself, but the Observable which is read-only
    public get resize(): Observable<number> {
        return this._resize.asObservable();
    };

    /**
     * Sets the width on each cell of a row to respect the columns' computed width.
     */
    public setWidths(row: any[]) {
        if (!this.widths || this.widths.length === 0) { return; }
        row.forEach(this.setCellWidth.bind(this));
    }

    /**
     * Un-sets the width we set on the headers, to allow re-computing new ones from scratch.
     */
    private clearHeadersWidth() {
        if (!this.widths || this.widths.length === 0) { return; }
        this.headers.forEach((header, index) => {
            // We only clean the ones we put ourselves, to preserve user-defined ones.
            if (!this.widths[index].strict) {
                this.renderer.setElementStyle(header, "width", null);
            }
        });
    }

    /**
     * Sets the width on a header.
     * Different from cells in that we need to avoid setting it if the user already did,
     * whether from CSS or styles binding.
     */
    private setHeaderWidth(cell: any, index: number) {
        let width = this.widths[index];
        if (width.strict) {
            // We do NOT set the width here, since we know the user already provided it.
            this.renderer.setElementClass(cell, STRICT_WIDTH_CLASS, true);
        } else {
            this.renderer.setElementClass(cell, STRICT_WIDTH_CLASS, false);
            this.renderer.setElementStyle(cell, "width", width.px + "px");
        }
    }

    /**
     * Sets the width on a cell. Adds the strict class if the cell should not be flexible.
     */
    private setCellWidth(cell: any, index: number) {
        let width = this.widths[index];
        if (width) {
            this.renderer.setElementClass(cell, STRICT_WIDTH_CLASS, width.strict);
            this.renderer.setElementStyle(cell, "width", width.px + "px");
        }
    }
}