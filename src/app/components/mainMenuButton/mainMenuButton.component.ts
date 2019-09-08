import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CollectionService } from '../../services/collection/collection.service';
import { InputDialogComponent } from '../dialogs/inputDialog/inputDialog.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { RenameCollectionDialogComponent } from '../dialogs/renameCollectionDialog/renameCollectionDialog.component';
import { SnackBarService } from '../../services/snackBar/snackBar.service';
import { ConfirmationDialogComponent } from '../dialogs/confirmationDialog/confirmationDialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ErrorDialogComponent } from '../dialogs/errorDialog/errorDialog.component';
import { Router } from '@angular/router';
import { Operation } from '../../core/enums';

@Component({
  selector: 'main-menu-button',
  templateUrl: './mainMenuButton.component.html',
  styleUrls: ['./mainMenuButton.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MainMenuButtonComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  constructor(private dialog: MatDialog, private collection: CollectionService,
    private snackBar: SnackBarService, private translate: TranslateService, public router: Router) {
  }

  public collections: string[];
  public activeCollection: string = "";

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public async ngOnInit(): Promise<void> {
    // Workaround for auto reload
    await this.collection.initializeAsync();
    await this.getCollectionsAsync();

    this.subscription = this.collection.collectionsChanged$.subscribe(() => this.router.navigate(['/loading']));
  }

  public async addCollectionAsync(): Promise<void> {
    if (this.collection.hasOpenNotes()) {
      this.snackBar.closeNoteBeforeChangingCollectionsAsync();
      return;
    }

    let titleText: string = await this.translate.get('DialogTitles.AddCollection').toPromise();
    let placeholderText: string = await this.translate.get('Input.Collection').toPromise();

    let dialogRef: MatDialogRef<InputDialogComponent> = this.dialog.open(InputDialogComponent, {
      width: '450px', data: { titleText: titleText, placeholderText: placeholderText }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        let collection: string = dialogRef.componentInstance.inputText;

        let operation: Operation = await this.collection.addCollectionAsync(collection);

        switch (operation) {
          case Operation.Duplicate: {
            this.snackBar.duplicateCollectionAsync(collection);
            break;
          }
          case Operation.Error: {
            let errorText: string = (await this.translate.get('ErrorTexts.AddCollectionError', { collection: collection }).toPromise());
            this.dialog.open(ErrorDialogComponent, {
              width: '450px', data: { errorText: errorText }
            });
            break;
          }
          default: {
            // Other cases don't need handling
            break;
          }
        }
      }
    });
  }

  public async activateCollection(collection: string) {
    if (collection === this.activeCollection) {
      return;
    }

    if (this.collection.hasOpenNotes()) {
      this.snackBar.closeNoteBeforeChangingCollectionsAsync();
      return;
    }

    this.collection.activateCollection(collection);
  }

  public renameCollection(collection: string) {
    if (this.collection.hasOpenNotes()) {
      this.snackBar.closeNoteBeforeChangingCollectionsAsync();
      return;
    }

    let dialogRef: MatDialogRef<RenameCollectionDialogComponent> = this.dialog.open(RenameCollectionDialogComponent, {
      width: '450px', data: { oldCollection: collection }
    });
  }

  public async deleteCollectionAsync(collection: string): Promise<void> {
    if (this.collection.hasOpenNotes()) {
      this.snackBar.closeNoteBeforeChangingCollectionsAsync();
      return;
    }

    let title: string = await this.translate.get('DialogTitles.ConfirmDeleteCollection').toPromise();
    let text: string = await this.translate.get('DialogTexts.ConfirmDeleteCollection', { collection: collection }).toPromise();

    let dialogRef: MatDialogRef<ConfirmationDialogComponent> = this.dialog.open(ConfirmationDialogComponent, {

      width: '450px', data: { dialogTitle: title, dialogText: text }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        let operation: Operation = await this.collection.deleteCollectionAsync(collection);

        if (operation === Operation.Error) {
          let errorText: string = (await this.translate.get('ErrorTexts.DeleteCollectionError', { collection: collection }).toPromise());
          this.dialog.open(ErrorDialogComponent, {
            width: '450px', data: { errorText: errorText }
          });
        }
      }
    });
  }

  private async getCollectionsAsync(): Promise<void> {
    this.collections = await this.collection.getCollectionsAsync();
    this.activeCollection = this.collection.getActiveCollection();
  }
}
