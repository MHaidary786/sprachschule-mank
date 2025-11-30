import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {SiCloudArrowUpIcon, SiLockClosedIcon, SiInboxStackIcon } from '@semantic-icons/heroicons/24/solid';

@Component({
  selector: 'app-home',
  imports: [MatIconModule, SiCloudArrowUpIcon, SiLockClosedIcon, SiInboxStackIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
