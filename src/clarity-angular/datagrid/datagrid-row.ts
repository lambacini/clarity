/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import {
    Component, Input, Output, EventEmitter, QueryList, ContentChildren, ElementRef,
    AfterContentInit, OnDestroy
} from "@angular/core";
import {Subscription} from "rxjs/Subscription";
import {Selection, SelectionType} from "./providers/selection";
import {RowActionService} from "./providers/row-action-service";
import {ColumnsWidth} from "./providers/columns-width";
import {DatagridCell} from "./datagrid-cell";

@Component({
    selector: "clr-dg-row",
    template: `
        <clr-dg-cell *ngIf="selection.selectionType === SELECTION_TYPE.Multi" class="datagrid-select">
            <clr-checkbox [ngModel]="selected" (ngModelChange)="toggle($event)"></clr-checkbox>
        </clr-dg-cell>
        <clr-dg-cell *ngIf="selection.selectionType === SELECTION_TYPE.Single" class="datagrid-select">
            <input type="radio" [name]="selection.id + '-radio'" [value]="item" [(ngModel)]="selection.currentSingle">
        </clr-dg-cell>
        <clr-dg-cell *ngIf="rowActionService.actionableCount > 0" class="datagrid-row-actions">
            <ng-content select="clr-dg-action-overflow"></ng-content>
        </clr-dg-cell>
        <ng-content></ng-content>
    `,
    host: {
        "[class.datagrid-row]": "true",
        "[class.datagrid-selected]": "selected"
    }
})
export class DatagridRow implements AfterContentInit, OnDestroy {
    /* reference to the enum so that template can access */
    public SELECTION_TYPE = SelectionType;

    /**
     * Model of the row, to use for selection
     */
    @Input("clrDgItem") item: any;

    constructor(public selection: Selection, public rowActionService: RowActionService,
                private columnsWidth: ColumnsWidth) {}

    private _selected = false;
    /**
     * Indicates if the row is selected
     */
    public get selected() {
        if (this.selection.selectionType === SelectionType.None) {
            return this._selected;
        } else {
            return this.selection.isSelected(this.item);
        }
    }
    @Input("clrDgSelected")
    public set selected(value: boolean) {
        if (this.selection.selectionType === SelectionType.None) {
            this._selected = value;
        } else {
            this.selection.setSelected(this.item, value);
        }
    }

    @Output("clrDgSelectedChange") selectedChanged = new EventEmitter<boolean>(false);

    public toggle(selected = !this.selected) {
        if (selected !== this.selected) {
            this.selected = selected;
            this.selectedChanged.emit(selected);
        }
    }

    /*
     * Smart column sizing
     */
    @ContentChildren(DatagridCell, {read: ElementRef}) private cells: QueryList<ElementRef>;

    ngAfterContentInit() {
        this._columnsWidthSubscription = this.columnsWidth.resize.subscribe(() => {
            this.columnsWidth.setWidths(this.cells.map(cell => cell.nativeElement));
        });
        this.columnsWidth.setWidths(this.cells.map(cell => cell.nativeElement));
    }

    /**
     * Subscription to the page service changes
     */
    private _columnsWidthSubscription: Subscription;
    ngOnDestroy() {
        this._columnsWidthSubscription.unsubscribe();
    }
}