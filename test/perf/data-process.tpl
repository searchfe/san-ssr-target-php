{$stat=[]}
{$stat['count']=0}
{$stat['seven']=0}
{foreach $items as $item}
{$stat['count']=$stat['count']+$item}
{if $stat['count'] % 7 == 0}{$stat['seven']=$stat['seven']+1}{/if}
{/foreach}
<div>{json_encode($stat)}</div>
