import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormControl,FormBuilder,FormGroup,Validators, FormArray} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { UsercrudService } from '../services/usercrud.service';
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common'; 
import { Subject } from 'rxjs';
import { Pipe } from '@angular/core';

@Component({
  selector: 'app-start-trip',
  templateUrl: './start-trip.component.html',
  styleUrls: ['./start-trip.component.css']
})

@Pipe({ name: 'sortBy' })

export class StartTripComponent implements OnInit {

  headers = new HttpHeaders().set('Content-Type', 'application/json')  
  .append('Authorization', 'Bearer ' + window.sessionStorage.getItem('access_token'));
 
  currency: Array<any>;
  emp_id: String;
  user_id: String;
  data: any;
  tripform: FormGroup;
  value: String;
  place: String;


  constructor(public userservice: UsercrudService,private toastr: ToastrService,private loc: Location,private http: HttpClient, public router: Router, private actRoute: ActivatedRoute, public fb: FormBuilder) 
  { 
    this.emp_id = this.actRoute.snapshot.params._id;

    this.tripform = new FormGroup({
      employee_id: new FormControl(),
      itemRows: this.fb.array([this.initItemRows()]),
    });

  }  

  ngOnInit(): void {
    this.user_id = this.actRoute.snapshot.params.user_id;
    this.getCurrency();
  }

  onEnter(val: string) 
  {
    // console.log(val)
    this.value = val; 
    if(this.value == 'USD')
    {
    this.place = 'INR to USD Conversion Rate';
    }
    else
    {
    this.place = 'USD to Local Currency Conversion Rate';
    }
  }

showSubmit() 
{
  this.toastr.success('submitted successfully!');
}

getCurrency()
{
  this.http.get<any>('https://api.plint.in/em/currencies').subscribe(res => {
    this.currency = res.data;
    console.log(res)
    });  
}

get formArr() {
  return this.tripform.get('itemRows') as FormArray;
}

initItemRows() 
{
  return this.fb.group({
    amount:['', Validators.required] ,
    rate: ['', Validators.required],
    currency: ['USD', Validators.required],
  });
}

addNewRow() {
  this.formArr.push(this.initItemRows());
}

deleteRow(index: number) {
  this.formArr.removeAt(index);
}

onSubmit()
{
  
if(this.tripform.valid)
{     
  let num = (this.tripform.value.itemRows.length);
  let starting_balance = [];
  
  for(let i=0; i<num; i++)
  {
    if(this.tripform.value.itemRows[i].currency == "USD")
    {
    let usdamount = parseInt(this.tripform.value.itemRows[i].amount)
    let usdrate = parseFloat(this.tripform.value.itemRows[i].rate)
    starting_balance.push(
         {
             "holding":
            {
             "currency":this.tripform.value.itemRows[i].currency,
             "amount":(1/usdamount) 
            },
           "inr_to_usd_conversion_rate":usdrate
          }
     );
    }
    else
    {
    let localamount = parseInt(this.tripform.value.itemRows[i].amount)
    let localrate = parseFloat(this.tripform.value.itemRows[i].rate)
    starting_balance.push(
     {
             "holding":
            {
             "currency":this.tripform.value.itemRows[i].currency,
             "amount":localamount
            },
           "usd_to_local_currency_conversion_rate":localrate
      }
     );
    }

  }

this.userservice.userStartTrip(this.emp_id, starting_balance)
  .subscribe((res) =>{
      console.log(res)
      this.showSubmit();
      this.reset(); 
      this.router.navigateByUrl('/usertrips');
   });

}
else 
{ 
  this.toastr.error('Error', 'Try again', {
  timeOut: 3000,
  });
}

}

reset()
{
this.tripform = this.fb.group({
  employee_id: "",
  amount: "",
  currency: "",
  rate: "",  
});
}

}
