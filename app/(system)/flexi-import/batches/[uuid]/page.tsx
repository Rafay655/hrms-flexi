"use client";
import {useParams} from 'next/navigation';
import {useAppSelector} from '@/store/hooks';
import {EmployeeBatchReview} from '../../_components/employee-batch-review';
export default function BatchDetailPage(){const {uuid}=useParams<{uuid:string}>();const company=useAppSelector(state=>state.auth.company?.id);const user=useAppSelector(state=>state.auth.user?.id);return <EmployeeBatchReview key={`${company}-${user}-${uuid}`} uuid={uuid}/>;}
