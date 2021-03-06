import * as R from 'ramda'
import { Component, OnInit, OnDestroy } from '@angular/core'
import { HeaderService } from '../header/header.service'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Apollo } from 'apollo-angular'
import { Vehicle } from '../../schema-types'
import { VehiclesQueryResponse, VEHICLES_QUERY } from '../graphql'
import { fadeInAnimation } from '../animations/fade-in.animation'
import { timer } from 'rxjs/observable/timer'
import { Subscription } from 'rxjs/Subscription'
import { Observable } from 'rxjs/Observable'
import { ActivatedRoute } from '@angular/router'

@Component({
    selector: 'app-vehicles-list',
    templateUrl: './vehicles-list.component.html',
    styleUrls: ['./vehicles-list.component.css'],
    animations: [fadeInAnimation],
})
export class VehiclesListComponent implements OnInit, OnDestroy {
    loading = true
    vehiclesList: Vehicle[]
    lineList: Vehicle[]

    listFilter: string
    viewPortItems: Vehicle[]
    subscriptions: Subscription[] = []

    lat = 53.4461311
    lng = 14.49227
    zoom = 16

    iconSet: any = {}

    line$: Observable<string>
    line: string

    constructor(
        private apollo: Apollo,
        private route: ActivatedRoute,
        private headerService: HeaderService
    ) {}

    ngOnInit() {
        this.headerService.setMenuMode()
        this.headerService.setMenuTitle('Find bus - list of vehicles')

        const getVehiclesQuery = () => {
            const query = this.apollo.watchQuery<VehiclesQueryResponse>({
                query: VEHICLES_QUERY,
            })
            // refetch co 30s
            query.startPolling(1000 * 30)

            return query.valueChanges
        }
        const vehiclesQuery = getVehiclesQuery()

        const querySubscription = vehiclesQuery.subscribe((response) => {
            this.loading = false
            this.vehiclesList = response.data.vehicles
            this.lineList = R.pipe(
                R.uniqBy(R.prop('line')),
                R.sortBy(R.pipe(R.prop('line'), (v) => Number(v) || Infinity))
            )(response.data.vehicles)
        })

        this.line$ = this.route.paramMap.map((params) => params.get('line'))

        const lineSubscribe = this.line$.distinctUntilChanged().subscribe((v) => {
            console.log(v)
            this.line = v
        })

        this.subscriptions = [...this.subscriptions, querySubscription, lineSubscribe]
    }

    ngOnDestroy(): void {
        for (const sub of this.subscriptions) {
            if (sub && sub.unsubscribe) {
                sub.unsubscribe()
            }
        }
    }

    getNumber(v: string) {
        return Number(v)
    }
    getIconUrl(name: string) {
        if (this.iconSet[name]) {
            return this.iconSet[name]
        }
        const canvas = document.createElement('canvas')
        canvas.width = 50
        canvas.height = 20
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(10, 175, 249, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = '12px Arial'
        ctx.fillStyle = 'rgb(255,255,255)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(name, canvas.width / 2, canvas.height / 2)
        const url = canvas.toDataURL()
        console.log(url)
        this.iconSet[name] = url
        return this.iconSet[name]
    }
}
