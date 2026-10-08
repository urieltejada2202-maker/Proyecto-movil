import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  tabSeleccionado: string = 'home';

  constructor() { }

  ngOnInit() {
  }

  tabCambiada(event: any) {
    this.tabSeleccionado = event.tab;
  }

}