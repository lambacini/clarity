/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import {Injectable} from "@angular/core";
import {ColumnsWidth} from "./columns-width";

@Injectable()
export class RowActionService {

    constructor(private columnsWidth: ColumnsWidth) {}

    /**
     * a value of 0 means no rows with action
     */
    private _actionableCount = 0;
    public get actionableCount(): number {
        return this._actionableCount;
    }

    public register() {
        this._actionableCount++;
    }

    public deregister() {
        this._actionableCount--;
    }

    /*
     * Ad-hoc dirty lock, handling only a single pending action
     */
    private locked = false;
    private waiting: () => void;

    public open(fn: () => void) {
        if (!this.locked) {
            this.locked = true;
            fn();
            // Scrollbar might have disappeared, we need to recompute the layout.
            this.columnsWidth.setColumnsWidth();
        } else {
            this.waiting = fn;
        }
    }

    public close() {
        if (this.waiting) {
            this.waiting();
            delete this.waiting;
        } else {
            this.locked = false;
            // Scrollbar might have appeared, we need to recompute the layout.
            this.columnsWidth.setColumnsWidth();
        }
    }
}
