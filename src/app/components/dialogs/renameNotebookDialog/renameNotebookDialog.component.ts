import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { CollectionService } from '../../../services/collection/collection.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ErrorDialogComponent } from '../errorDialog/errorDialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Operation } from '../../../core/enums';
import { SnackBarService } from '../../../services/snackBar/snackBar.service';

@Component({
    selector: 'rename-notebook-dialog',
    templateUrl: './renameNotebookDialog.component.html',
    styleUrls: ['./renameNotebookDialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RenameNotebookDialogComponent implements OnInit {
    constructor(private collection: CollectionService, private dialogRef: MatDialogRef<RenameNotebookDialogComponent>,
        private translate: TranslateService, @Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog,
        private snackBar: SnackBarService) {
        dialogRef.disableClose = true;
    }

    public notebookId: string = this.data.notebookId;
    public notebookName: string = this.collection.getNotebookName(this.data.notebookId);

    public ngOnInit(): void {
    }

    public async renameNotebookAsync(): Promise<void> {
        let operation: Operation = await this.collection.renameNotebookAsync(this.notebookId, this.notebookName);

        if (operation === Operation.Error) {
            let errorText: string = (await this.translate.get('ErrorTexts.RenameNotebookError', { notebookName: this.notebookName }).toPromise());

            this.dialog.open(ErrorDialogComponent, {
                width: '450px', data: { errorText: errorText }
            });
        } else if (operation === Operation.Duplicate) {
            this.snackBar.duplicateNotebookAsync(this.notebookName);
        }
    }

    public async renameNotebookAndCloseAsync(): Promise<void> {
        await this.renameNotebookAsync();
        this.dialogRef.close();
    }
}
