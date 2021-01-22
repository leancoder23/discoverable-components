<template>
    <div>Yay, it works:  Hello {{message}} 
        <br/>
    content : {{content}} 
    <br/>
    list : {{list}} 
    </div>
</template>

<script>
export default {
    data () {
        return {
            message: "my message",
            content: {},
            list: []
        }
    },
    mounted () {
        console.log('vue is mounted');
        console.log(this.$el);
    }
};
</script>
