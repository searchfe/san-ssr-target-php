<div class="todos">
    <a href="#/add" class="todo-add"><i class="fa fa-plus-square"></i></a>
    <ul class="filter-category">
        {foreach $categories as $item}
        <li style="background: {$item.color|escape}">
            <a href="/todos/category/{$item.id|escape}">{$item.title|escape}</a>
        </li>
        {/foreach}
    </ul>

    <ul class="todo-list">
        {foreach $todos as $index=>$item}
        <li style="border-color: {$item.category.color|escape}"
            class="{if $item.done}todo-done{/if}"
        >
            <h3>{$item.title|escape}</h3>
            <p>{$item.desc|escape}</p>
            <div class="todo-meta">
                {if $item.category}
                <span>{$item.category.title|escape}</span>
                {/if}
            </div>
            <a class="fa fa-pencil" href="/edit/{$item.id|escape}"></a>
            <i class="fa fa-check" on-click="doneTodo(index)"></i>
            <i class="fa fa-trash-o" on-click="rmTodo(index)"></i>
        </li>
        {/foreach}
    </ul>
</div>
